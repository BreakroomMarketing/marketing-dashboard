
import React from 'react';

interface AppHeaderProps {
  title: string;
  subtitle: string;
}

export const AppHeader: React.FC<AppHeaderProps> = ({ title, subtitle }) => {
  return (
    <header className="mb-8 sm:mb-12">
      <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-center text-brand-primary">
        {title}
      </h1>
      <p className="text-center text-dark-text-secondary mt-2 text-sm sm:text-base">
        {subtitle}
      </p>
    </header>
  );
};
