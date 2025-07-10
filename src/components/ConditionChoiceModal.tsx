// src/components/ConditionChoiceModal.tsx
import React from 'react';

interface ConditionChoiceModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectConditionType: (conditionType: 'true' | 'false') => void;
  sourceNodeId: string | null; // For context, if needed in future
}

export const ConditionChoiceModal: React.FC<ConditionChoiceModalProps> = ({
  isOpen,
  onClose,
  onSelectConditionType,
}) => {
  if (!isOpen) {
    return null;
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white p-6 rounded-lg shadow-xl w-full max-w-sm">
        <h3 className="text-lg font-semibold mb-4 text-gray-800">Select Path Type</h3>
        <p className="text-sm text-gray-600 mb-6">
          This edge comes from a decision node. Please specify if this path represents the 'True' or 'False' condition.
        </p>
        <div className="flex justify-around space-x-3">
          <button
            onClick={() => onSelectConditionType('true')}
            className="flex-1 px-4 py-2.5 bg-emerald-500 text-white rounded-md hover:bg-emerald-600 focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:ring-opacity-75 transition-colors"
          >
            True / Yes
          </button>
          <button
            onClick={() => onSelectConditionType('false')}
            className="flex-1 px-4 py-2.5 bg-red-500 text-white rounded-md hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-red-400 focus:ring-opacity-75 transition-colors"
          >
            False / No
          </button>
        </div>
        <button
          onClick={onClose}
          className="mt-6 w-full px-4 py-2 text-sm text-gray-600 bg-gray-100 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-300 transition-colors"
        >
          Cancel
        </button>
      </div>
    </div>
  );
};
