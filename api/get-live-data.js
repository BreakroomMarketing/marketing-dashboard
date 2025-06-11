// @ts-check
// Vercel Serverless Function: api/get-live-data.js
// Fetches live data from Meta (Facebook) and TikTok Ads APIs,
// calculates base and derived metrics.

const META_API_VERSION = 'v19.0';
const TIKTOK_API_VERSION = 'v1.3'; // Standard TikTok API version

/**
 * Formats a Date object into YYYY-MM-DD string.
 * @param {Date} date The date to format.
 * @returns {string} Formatted date string.
 */
function formatDate(date) {
  return date.toISOString().split('T')[0];
}

/**
 * Fetches data from Meta (Facebook) API.
 * @param {string} startDate YYYY-MM-DD
 * @param {string} endDate YYYY-MM-DD
 * @param {string} accessToken Meta API access token.
 * @param {string} adAccountId Meta Ad Account ID (without 'act_').
 * @returns {Promise<{[date: string]: {fbCost: number, fbClicks: number, fbImpr: number, fbConv: number}}>}
 */
async function fetchFacebookData(startDate, endDate, accessToken, adAccountId) {
  if (!accessToken || !adAccountId) {
    console.warn('[Meta] Access token or Ad Account ID is missing.');
    // Return an empty object that conforms to the expected structure.
    return /** @type {{[date: string]: {fbCost: number, fbClicks: number, fbImpr: number, fbConv: number}}} */ ({});
  }
  // Requesting actions field to filter for 'SurveyCompleted' later.
  const fields = 'spend,clicks,impressions,actions';
  const url = `https://graph.facebook.com/${META_API_VERSION}/act_${adAccountId}/insights?level=account&fields=${fields}&time_range={'since':'${startDate}','until':'${endDate}'}&time_increment=1&access_token=${accessToken}`;

  try {
    const response = await fetch(url);
    if (!response.ok) {
      const errorData = await response.json();
      console.error(`[Meta] API error (${response.status}):`, errorData.error?.message || response.statusText);
      throw new Error(`Facebook API request failed: ${errorData.error?.message || response.statusText}`);
    }
    const jsonResponse = await response.json();
    const processedData = /** @type {{[date: string]: {fbCost: number, fbClicks: number, fbImpr: number, fbConv: number}}} */ ({});
    jsonResponse.data?.forEach(entry => {
      // Find the 'SurveyCompleted' custom conversion action.
      // This assumes 'SurveyCompleted' is the exact action_type string.
      // In reality, it might be 'offsite_conversion.custom.EVENT_ID' or similar.
      const surveyAction = entry.actions?.find(a => a.action_type === 'SurveyCompleted');
      const conversions = surveyAction ? parseInt(surveyAction.value, 10) : 0;

      processedData[entry.date_start] = {
        fbCost: parseFloat(entry.spend || 0),
        fbClicks: parseInt(entry.clicks || 0, 10),
        fbImpr: parseInt(entry.impressions || 0, 10),
        fbConv: conversions,
      };
    });
    return processedData;
  } catch (error) {
    console.error('[Meta] Error fetching Facebook data:', error.message);
    throw error; // Re-throw to be caught by main handler
  }
}

/**
 * Fetches data from TikTok API.
 * @param {string} startDate YYYY-MM-DD
 * @param {string} endDate YYYY-MM-DD
 * @param {string} accessToken TikTok API access token.
 * @param {string} advertiserId TikTok Advertiser ID.
 * @returns {Promise<{[date: string]: {ttCost: number, ttClicks: number, ttImpr: number, ttConv: number}}>}
 */
async function fetchTikTokData(startDate, endDate, accessToken, advertiserId) {
  if (!accessToken || !advertiserId) {
    console.warn('[TikTok] Access token or Advertiser ID is missing.');
    // Return an empty object that conforms to the expected structure.
    return /** @type {{[date: string]: {ttCost: number, ttClicks: number, ttImpr: number, ttConv: number}}} */ ({});
  }
  const url = `https://business-api.tiktok.com/open_api/${TIKTOK_API_VERSION}/report/integrated/get/`;
  
  // Attempting to fetch 'submit_form' as a specific conversion metric.
  // If 'submit_form' is not a valid standard metric string, this might need adjustment
  // to 'total_conversion' or the specific custom event metric name configured in TikTok.
  const metrics = ["spend", "clicks", "impressions", "submit_form"]; 
  const body = {
    advertiser_id: advertiserId,
    report_type: "BASIC",
    data_level: "AUCTION_ADVERTISER", // Changed from ACCOUNT based on common use, can be ACCOUNT
    dimensions: ["stat_time_day"],
    metrics: metrics,
    start_date: startDate,
    end_date: endDate,
    page_size: 366, // Max days in a year +1 for safety
    page: 1,
    order_field: "stat_time_day",
    order_type: "ASC",
  };

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Access-Token': accessToken,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error(`[TikTok] API error (${response.status}):`, errorData.message || response.statusText, 'Request ID:', errorData.request_id);
      throw new Error(`TikTok API request failed: ${errorData.message || response.statusText}`);
    }
    const jsonResponse = await response.json();
    if (jsonResponse.code !== 0) {
        console.error('[TikTok] API returned error code:', jsonResponse);
        throw new Error(`TikTok API error: ${jsonResponse.message} (Code: ${jsonResponse.code}, Request ID: ${jsonResponse.request_id})`);
    }

    const processedData = /** @type {{[date: string]: {ttCost: number, ttClicks: number, ttImpr: number, ttConv: number}}} */ ({});
    jsonResponse.data?.list?.forEach(entry => {
      processedData[entry.dimensions.stat_time_day] = {
        ttCost: parseFloat(entry.metrics.spend || 0),
        ttClicks: parseInt(entry.metrics.clicks || 0, 10),
        ttImpr: parseInt(entry.metrics.impressions || 0, 10),
        // Mapping 'submit_form' (or the metric fetched) to ttConv
        ttConv: parseInt(entry.metrics.submit_form || 0, 10), 
      };
    });
    return processedData;
  } catch (error) {
    console.error('[TikTok] Error fetching TikTok data:', error.message);
    throw error;
  }
}

/**
 * Generates an array of date strings between two dates.
 * @param {string} startDateStr YYYY-MM-DD
 * @param {string} endDateStr YYYY-MM-DD
 * @returns {string[]} Array of date strings.
 */
function getDateArray(startDateStr, endDateStr) {
  const dates = [];
  let currentDate = new Date(startDateStr + 'T00:00:00Z'); // Use UTC to avoid timezone issues
  const stopDate = new Date(endDateStr + 'T00:00:00Z');
  while (currentDate <= stopDate) {
    dates.push(formatDate(new Date(currentDate))); // new Date to avoid mutation
    currentDate.setDate(currentDate.getDate() + 1);
  }
  return dates;
}

/**
 * Calculates a derived metric, handling division by zero.
 * @param {number} numerator
 * @param {number} denominator
 * @param {number} [multiplier=1]
 * @returns {number} Calculated metric or 0 if division by zero.
 */
const calculateMetric = (numerator, denominator, multiplier = 1) => {
  if (denominator === 0 || isNaN(numerator) || isNaN(denominator)) {
    return 0;
  }
  const result = (numerator / denominator) * multiplier;
  // It's good practice to round financial/percentage metrics to a few decimal places
  // For simplicity, direct result is used. For precise financial reporting, use a library or fixed-point arithmetic.
  return result; // Or parseFloat(result.toFixed(4)) for example
};

/**
 * Calculates all derived metrics for a given day's base metrics.
 * @param {object} baseEntry Object containing base metrics for a day.
 * @returns {object} Object containing all calculated derived metrics.
 */
function calculateAllDerivedMetrics(baseEntry) {
    return {
        fbCtr: calculateMetric(baseEntry.fbClicks, baseEntry.fbImpr, 100),
        fbCpm: calculateMetric(baseEntry.fbCost, baseEntry.fbImpr, 1000),
        fbCpc: calculateMetric(baseEntry.fbCost, baseEntry.fbClicks),
        fbCpa: calculateMetric(baseEntry.fbCost, baseEntry.fbConv),
        fbCvr: calculateMetric(baseEntry.fbConv, baseEntry.fbClicks, 100),
        ttCtr: calculateMetric(baseEntry.ttClicks, baseEntry.ttImpr, 100),
        ttCpm: calculateMetric(baseEntry.ttCost, baseEntry.ttImpr, 1000),
        ttCpc: calculateMetric(baseEntry.ttCost, baseEntry.ttClicks),
        ttCpa: calculateMetric(baseEntry.ttCost, baseEntry.ttConv),
        ttCvr: calculateMetric(baseEntry.ttConv, baseEntry.ttClicks, 100),
    };
}


export default async function handler(event) {
  if (event.httpMethod !== 'GET' && event.method !== 'GET') { // Vercel might use event.method
    return {
      statusCode: 405,
      body: JSON.stringify({ error: { message: 'Method Not Allowed. Please use GET.' } }),
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
    };
  }

  const META_ACCESS_TOKEN = process.env.META_ACCESS_TOKEN;
  const META_AD_ACCOUNT_ID = process.env.META_AD_ACCOUNT_ID;
  const TIKTOK_ACCESS_TOKEN = process.env.TIKTOK_ACCESS_TOKEN;
  const TIKTOK_ADVERTISER_ID = process.env.TIKTOK_ADVERTISER_ID;

  if (!META_ACCESS_TOKEN || !META_AD_ACCOUNT_ID || !TIKTOK_ACCESS_TOKEN || !TIKTOK_ADVERTISER_ID) {
    console.error('API credentials are not fully configured in environment variables.');
    return {
        statusCode: 503,
        body: JSON.stringify({ error: { message: 'Service Unavailable: API credentials missing.' } }),
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
    };
  }

  try {
    let daysToFetch = 90; // Default days
    const queryParams = event.query || {}; // Vercel event.query

    if (queryParams.days) {
      const daysParam = parseInt(queryParams.days, 10);
      // Allow 90 or 365 days
      if (!isNaN(daysParam) && (daysParam === 90 || daysParam === 365)) {
        daysToFetch = daysParam;
      }
    }

    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(endDate.getDate() - (daysToFetch - 1));

    const startDateFormatted = formatDate(startDate);
    const endDateFormatted = formatDate(endDate);

    const [fbPlatformDataResult, ttPlatformDataResult] = await Promise.allSettled([
      fetchFacebookData(startDateFormatted, endDateFormatted, META_ACCESS_TOKEN, META_AD_ACCOUNT_ID),
      fetchTikTokData(startDateFormatted, endDateFormatted, TIKTOK_ACCESS_TOKEN, TIKTOK_ADVERTISER_ID)
    ]);

    const fbData = fbPlatformDataResult.status === 'fulfilled' ? fbPlatformDataResult.value : /** @type {{[date: string]: {fbCost: number, fbClicks: number, fbImpr: number, fbConv: number}}} */ ({});
    const ttData = ttPlatformDataResult.status === 'fulfilled' ? ttPlatformDataResult.value : /** @type {{[date: string]: {ttCost: number, ttClicks: number, ttImpr: number, ttConv: number}}} */ ({});

    if (fbPlatformDataResult.status === 'rejected') {
        console.error("[Handler] Facebook data promise rejected:", fbPlatformDataResult.reason?.message || fbPlatformDataResult.reason);
    }
    if (ttPlatformDataResult.status === 'rejected') {
        console.error("[Handler] TikTok data promise rejected:", ttPlatformDataResult.reason?.message || ttPlatformDataResult.reason);
    }
    
    const defaultFbEntry = { fbClicks: 0, fbImpr: 0, fbCost: 0, fbConv: 0 };
    const defaultTtEntry = { ttClicks: 0, ttImpr: 0, ttCost: 0, ttConv: 0 };

    const allDatesInRange = getDateArray(startDateFormatted, endDateFormatted);
    const finalData = allDatesInRange.map(dateStr => {
      const fbEntry = fbData[dateStr] || defaultFbEntry;
      const ttEntry = ttData[dateStr] || defaultTtEntry;
      
      const baseMetricsEntry = {
        date: dateStr,
        fbClicks: fbEntry.fbClicks,
        fbImpr: fbEntry.fbImpr,
        fbCost: fbEntry.fbCost,
        fbConv: fbEntry.fbConv,
        ttClicks: ttEntry.ttClicks,
        ttImpr: ttEntry.ttImpr,
        ttCost: ttEntry.ttCost,
        ttConv: ttEntry.ttConv,
      };

      const derivedMetrics = calculateAllDerivedMetrics(baseMetricsEntry);

      return {
        ...baseMetricsEntry,
        ...derivedMetrics,
      };
    });
    
    finalData.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    return {
      statusCode: 200,
      body: JSON.stringify(finalData),
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 's-maxage=300, stale-while-revalidate', // Cache for 5 mins
        'Access-Control-Allow-Origin': '*', // CORS for local dev if needed
      },
    };

  } catch (error) {
    console.error("[Handler] Error in get-live-data main processing:", error.message, error.stack);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: { message: `Server error: ${error.message}` } }),
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
    };
  }
}