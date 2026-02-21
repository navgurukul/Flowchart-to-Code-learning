import React from 'react';

export const Footer: React.FC = () => {
  return (
    <footer className="bg-white border-t border-gray-200 py-4 px-6">
      <div className="max-w-7xl mx-auto flex items-center justify-center">
        <div className="flex items-center space-x-2 text-sm text-gray-600">
          <span>Made by</span>
          <img 
            src="/navgurukul-labs-logo.svg" 
            alt="ai.navgurukil LABS" 
            className="h-6"
          />
        </div>
      </div>
    </footer>
  );
};
