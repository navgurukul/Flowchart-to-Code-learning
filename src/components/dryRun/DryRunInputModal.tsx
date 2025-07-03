// src/components/dryRun/DryRunInputModal.tsx
import React, { useState } from 'react';
import { Node as FlowchartNode } from '../../types'; // Assuming this is your FlowchartNode type
import { DryRunVariableMap } from '../../types/dryRun';

interface DryRunInputModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (initialInputs: DryRunVariableMap) => void;
  flowchartNodes: FlowchartNode[]; // To identify input nodes
}

export const DryRunInputModal: React.FC<DryRunInputModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  flowchartNodes,
}) => {
  const [inputValues, setInputValues] = useState<DryRunVariableMap>({});

  // Identify input nodes from the flowchart
  const inputNodes = flowchartNodes.filter(node => node.type === 'input');

  const handleInputChange = (nodeId: string, nodeLabel: string, value: string) => {
    // Attempt to convert to number if possible, otherwise keep as string
    const numericValue = parseFloat(value);
    const actualValue = isNaN(numericValue) || value.trim() === '' ? value : numericValue;

    // Use node label as variable name, fallback to nodeId if label is empty
    const varName = nodeLabel?.trim().replace(/\s+/g, '_') || nodeId;
    setInputValues(prev => ({ ...prev, [varName]: actualValue }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Ensure all defined input nodes have some value (even if empty string from user)
    const finalInputs = { ...inputValues };
    inputNodes.forEach(node => {
      const varName = node.data.label?.trim().replace(/\s+/g, '_') || node.id;
      if (!(varName in finalInputs)) {
        finalInputs[varName] = ''; // Default to empty string if not touched
      }
    });
    onSubmit(finalInputs);
    onClose(); // Close modal after submission
  };

  if (!isOpen) {
    return null;
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white p-6 rounded-lg shadow-xl w-full max-w-md">
        <h2 className="text-xl font-semibold mb-4">Dry Run Initial Inputs</h2>
        {inputNodes.length === 0 ? (
          <p className="text-gray-600 mb-4">No input nodes found in the flowchart. Click "Start" to begin.</p>
        ) : (
          <form onSubmit={handleSubmit}>
            {inputNodes.map(node => {
              const varName = node.data.label?.trim().replace(/\s+/g, '_') || node.id;
              return (
                <div key={node.id} className="mb-4">
                  <label htmlFor={`input-${node.id}`} className="block text-sm font-medium text-gray-700 mb-1">
                    {node.data.label || `Input (ID: ${node.id})`}
                  </label>
                  <input
                    type="text"
                    id={`input-${node.id}`}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                    onChange={e => handleInputChange(node.id, node.data.label, e.target.value)}
                    placeholder="Enter value"
                  />
                </div>
              );
            })}
            <div className="mt-6 flex justify-end space-x-3">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md border border-gray-300"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md"
              >
                Start Dry Run
              </button>
            </div>
          </form>
        )}
        {/* For flowcharts with no inputs */}
        {inputNodes.length === 0 && (
            <div className="mt-6 flex justify-end space-x-3">
             <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md border border-gray-300"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  onSubmit({}); // Submit empty inputs
                  onClose();
                }}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md"
              >
                Start
              </button>
            </div>
        )}
      </div>
    </div>
  );
};
