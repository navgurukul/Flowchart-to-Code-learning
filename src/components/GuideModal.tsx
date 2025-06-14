// src/components/GuideModal.tsx
import React from 'react';
import { X, ChevronLeft, ChevronRight } from 'lucide-react';

interface GuideModalProps {
  isOpen: boolean;
  title: string;
  content: React.ReactNode;
  currentStep: number;
  totalSteps: number;
  onNext?: () => void;
  onPrev?: () => void;
  onClose: () => void;
  imageSrc?: string; // For actual image URLs
  imagePlaceholderText?: string; // For descriptive text
}

const GuideModal: React.FC<GuideModalProps> = ({
  isOpen,
  title,
  content,
  currentStep,
  totalSteps,
  onNext,
  onPrev,
  onClose,
  imageSrc,
  imagePlaceholderText,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4 transition-opacity duration-300 ease-in-out">
      <div className="bg-white rounded-xl shadow-2xl p-6 sm:p-8 w-full max-w-md md:max-w-lg transform transition-all duration-300 ease-in-out scale-95 opacity-0 animate-modalShow">
        {/* Header */}
        <div className="flex justify-between items-start mb-4">
          <h3 className="text-2xl font-bold text-gray-800">{title}</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors rounded-full p-1 -mt-1 -mr-1"
            aria-label="Close guide"
          >
            <X size={28} />
          </button>
        </div>

        {/* Content */}
        <div className="mb-6 text-gray-700 leading-relaxed space-y-4">
          {imageSrc ? (
            <div className="my-5 flex justify-center">
              <img
                src={imageSrc}
                alt={`Guide illustration for ${title}`}
                className="max-w-full h-auto max-h-60 object-contain rounded-lg shadow-sm"
              />
            </div>
          ) : imagePlaceholderText ? (
            <div className="my-5 p-4 bg-gray-100 border border-gray-200 rounded-lg text-center text-sm text-gray-500 italic">
              {imagePlaceholderText}
            </div>
          ) : null}
          <div className="prose prose-sm sm:prose-base max-w-none">{content}</div>
        </div>

        {/* Footer */}
        <div className="flex flex-col sm:flex-row justify-between items-center pt-4 border-t border-gray-200">
          <div className="mb-3 sm:mb-0">
            {currentStep > 0 && onPrev && (
              <button
                onClick={onPrev}
                className="flex items-center px-4 py-2 text-sm font-semibold text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg shadow-sm transition-colors duration-150"
              >
                <ChevronLeft size={20} className="mr-2" />
                Previous
              </button>
            )}
          </div>
          <div className="text-sm font-medium text-gray-500 mb-3 sm:mb-0">
            Step {currentStep + 1} of {totalSteps}
          </div>
          <div>
            {currentStep < totalSteps - 1 && onNext && (
              <button
                onClick={onNext}
                className="flex items-center px-4 py-2 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-md hover:shadow-lg transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
              >
                Next
                <ChevronRight size={20} className="ml-2" />
              </button>
            )}
            {currentStep === totalSteps - 1 && (
              <button
                onClick={onClose}
                className="px-6 py-2 text-sm font-semibold text-white bg-green-600 hover:bg-green-700 rounded-lg shadow-md hover:shadow-lg transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2"
              >
                Finish
              </button>
            )}
          </div>
        </div>
      </div>
      {/* Adding simple keyframe animation for modal appearance */}
      <style jsx global>{`
        @keyframes modalShow {
          0% {
            opacity: 0;
            transform: scale(0.95) translateY(10px);
          }
          100% {
            opacity: 1;
            transform: scale(1) translateY(0);
          }
        }
        .animate-modalShow {
          animation: modalShow 0.3s ease-out forwards;
        }
        // Basic prose styling if @tailwindcss/typography is not used
        .prose p { margin-bottom: 1em; }
        .prose ul, .prose ol { margin-left: 1.5em; margin-bottom: 1em; }
        .prose li { margin-bottom: 0.5em; }
      `}</style>
    </div>
  );
};

export default GuideModal;
