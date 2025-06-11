// @ts-check
// Vercel Serverless Function: api/ask-gemini.js

// Note: Vercel typically expects ES Modules for Node.js functions.
// If using CommonJS `require`, ensure your Vercel project settings or `vercel.json`
// are configured appropriately if issues arise, or switch to ES Module imports.
// For now, we'll keep `require` as it might be part of a transpilation step
// or specific Node.js version compatibility on Vercel.
import { GoogleGenAI } from "@google/genai"; // Assuming this is an ES Module import

const GEMINI_MODEL_NAME = 'gemini-2.5-flash-preview-04-17';

// System instruction for the AI model, now accepts currentDateString
const getSystemInstruction = (currentDateString) => `You are an expert-level Paid Social Media strategist. Your primary goal is to provide actionable insights and data-driven recommendations based on the provided marketing campaign data for Facebook (FB) and TikTok (TT).
Current date: ${currentDateString}. All monetary values are in GBP (£).
Core Responsibilities:
1. Critical Data Analysis: Analyze trends, compare performance, identify anomalies, and highlight key performance indicators (KPIs) from the data provided.
2. Strategic Recommendations: Provide specific, actionable recommendations (e.g., budget reallocation, A/B testing suggestions, creative optimizations) based strictly on the data shown.
3. Professional Terminology: Use clear, industry-standard language (e.g., CPA, CTR, ROAS, funnel analysis, campaign optimization).
4. Funnel Awareness: Interpret metrics in the context of a marketing funnel (awareness, consideration, conversion) if the data supports it.
5. Clarification and Probing: If a user's question is vague in relation to the provided data, ask clarifying questions to provide the most relevant advice.
6. Data Limitations: If the provided data is insufficient to answer a question or make a specific recommendation, clearly state this. Do not invent data or make assumptions beyond what is given.
7. Conciseness and Clarity: Present your analysis and recommendations clearly and concisely.
User Interaction Example (if user is vague):
User: "What's up with my ads?"
You (AI): "To best help you, could you clarify what aspects of your ad performance you're interested in based on the data I have? For instance, are you concerned about cost per acquisition, click-through rates, or perhaps a comparison between Facebook and TikTok performance for the period covered by the data?"
You will be provided with marketing data in JSON format for a specific period. Focus your analysis and recommendations *exclusively* on this provided data.`;

export default async function handler(event) {
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: { message: 'Method Not Allowed. Please use POST.' } }),
      headers: { 'Content-Type': 'application/json' },
    };
  }

  const geminiApiKey = process.env.GEMINI_API_KEY;
  if (!geminiApiKey) {
    console.error("GEMINI_API_KEY environment variable not found on the server.");
    return {
      statusCode: 500,
      body: JSON.stringify({ error: { message: "AI service is not configured. Missing API key." } }),
      headers: { 'Content-Type': 'application/json' },
    };
  }

  try {
    let requestBody;
    try {
      // Vercel passes the body directly for JSON content types if already parsed,
      // or as a string otherwise.
      if (typeof event.body === 'string') {
        requestBody = JSON.parse(event.body);
      } else {
        requestBody = event.body; // Already an object
      }
    } catch (parseError) {
      console.error("Failed to parse request body:", parseError);
      return {
        statusCode: 400,
        body: JSON.stringify({ error: { message: "Invalid request body: Not valid JSON." } }),
        headers: { 'Content-Type': 'application/json' },
      };
    }

    const { userQuery, marketingData, history = [] } = requestBody;

    if (!userQuery || typeof userQuery !== 'string' || userQuery.trim() === "") {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: { message: "Invalid or missing 'userQuery' in the request body." } }),
        headers: { 'Content-Type': 'application/json' },
      };
    }

    if (!marketingData || !Array.isArray(marketingData)) {
        return {
          statusCode: 400,
          body: JSON.stringify({ error: { message: "Invalid or missing 'marketingData' array in the request body." } }),
          headers: { 'Content-Type': 'application/json' },
        };
      }

    const aiInstance = new GoogleGenAI({ apiKey: geminiApiKey });

    // Prepare chat history for Gemini
    const validHistory = history
      .filter(msg => msg && typeof msg.text === 'string' && msg.text.trim() !== "" && typeof msg.sender === 'string' && !msg.isLoading)
      .map(msg => ({
        role: msg.sender === 'user' ? 'user' : 'model',
        parts: [{ text: msg.text }],
      }));
    
    // Generate current date for this specific request
    const currentDateForRequest = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });

    const chat = aiInstance.chats.create({
      model: GEMINI_MODEL_NAME,
      // Use dynamic system instruction with the current date for this request
      config: { systemInstruction: getSystemInstruction(currentDateForRequest) }, 
      history: validHistory,
    });

    // Construct the message content for Gemini, including the marketing data context
    let dataContextString = "(No specific marketing data was provided for this query. Please respond based on general knowledge or ask for data if needed.)";
    if (marketingData.length > 0) {
        // Assuming marketingData is sorted with most recent first (as generated by mock-data.ts and processed by App.tsx)
        const firstDate = marketingData[marketingData.length -1]?.date || 'N/A'; // Oldest date in the dataset
        const lastDate = marketingData[0]?.date || 'N/A'; // Newest date in the dataset
        dataContextString = `Here is the marketing data for the period from ${firstDate} to ${lastDate}. Please base your analysis on this entire dataset:\n${JSON.stringify(marketingData, null, 2)}\n\n`; // Use full marketingData
    }
    
    const fullPromptForGemini = `${dataContextString}User's Question: ${userQuery}`;

    const result = await chat.sendMessage({message: fullPromptForGemini});
    
    // Ensure response and text property exist
    if (!result || typeof result.text !== 'string') {
        console.error("Gemini API returned an unexpected response structure:", result);
        throw new Error("AI model returned an invalid response format.");
    }

    return {
      statusCode: 200,
      body: JSON.stringify({ reply: result.text }),
      headers: { 'Content-Type': 'application/json' }, 
    };

  } catch (error) {
    console.error("Error in ask-gemini function:", error);
    let errorMessage = "An error occurred while communicating with the AI model.";
    let statusCode = 500;

    if (error.message) {
      errorMessage = error.message;
      if (error.message.toLowerCase().includes("api key not valid")) {
        statusCode = 401; // Unauthorized
        errorMessage = "AI service authentication failed: Invalid API key.";
      } else if (error.message.toLowerCase().includes("quota")) {
        statusCode = 429; // Too Many Requests
        errorMessage = "AI service quota exceeded. Please try again later.";
      } else if (error.message.toLowerCase().includes("invalid response format")){
        errorMessage = "The AI model returned an unexpected response. Please try again."
      }
    }
    
    return {
      statusCode: statusCode,
      body: JSON.stringify({ error: { message: errorMessage } }),
      headers: { 'Content-Type': 'application/json' },
    };
  }
}