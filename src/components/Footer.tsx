import React from 'react';

export const Footer: React.FC = () => {
  return (
    <footer className="bg-white border-t border-gray-200 py-4 px-6">
      <div className="max-w-7xl mx-auto flex items-center justify-center">
        <div className="flex items-center space-x-3 text-base text-gray-600">
          <span>Made by</span>
          <svg width="240" height="40" viewBox="0 0 960 400" className="h-8" xmlns="http://www.w3.org/2000/svg">
            {/* ai. in orange */}
            <text x="90" y="240" fontFamily="Arial, sans-serif" fontSize="120" fontWeight="bold" fill="#FF5722">ai.</text>
            
            {/* navgurukil in black */}
            <text x="200" y="240" fontFamily="Arial, sans-serif" fontSize="120" fontWeight="bold" fill="#000000">navgurukil</text>
            
            {/* LABS in rounded rectangle */}
            <rect x="770" y="180" width="180" height="80" rx="10" stroke="#000000" strokeWidth="4" fill="none"/>
            <text x="785" y="235" fontFamily="Arial, sans-serif" fontSize="48" fontWeight="bold" fill="#000000">LABS</text>
          </svg>
        </div>
      </div>
    </footer>
  );
};
