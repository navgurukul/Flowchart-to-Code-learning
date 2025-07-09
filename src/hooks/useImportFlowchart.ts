import { useState, useCallback, useRef } from 'react';
import { FlowchartData } from '../types'; // Assuming FlowchartData is the correct type for chartJson

// Define the structure for the validation report items
// This should align with what src/engine/validator.js produces
export interface ValidationReportItem {
  id?: string; // Optional: ID of the node/element causing the issue
  message: string;
  type: 'Error' | 'Warning' | 'Info' | 'Structural' | 'Connectivity' | 'Expression' | 'Critical'; // Extend as needed
}

interface UseImportFlowchartReturn {
  isLoading: boolean;
  error: string | null;
  chartJson: FlowchartData | null;
  validationReport: ValidationReportItem[] | null;
  triggerImport: () => void; // Function to open file dialog
  // We'll also need a way to pass the selected file to the hook,
  // or manage the input element within the hook.
  // For now, triggerImport will handle the file input ref.
  clearImportedData: () => void;
}

// Placeholder for the actual API call function
import { validateFlowchart as engineValidateFlowchart } from '../engine/validator.js';
import { FlowchartNode } from '../types'; // FlowchartNode might be needed for transformation

// This would typically be in an api.ts or similar service file
const callAnalyzeFlowchartApi = async (file: File): Promise<{ chartJson: FlowchartData /*, validationReport: ValidationReportItem[]*/ }> => {
  const formData = new FormData();
  formData.append('file', file);

  // Assuming the backend endpoint is /api/analyze_flowchart_image
  // Adjust the URL as necessary based on your actual backend setup
  const response = await fetch('/api/analyze_flowchart_image', {
    method: 'POST',
    // Headers might be needed for auth tokens if your endpoint is protected
    // headers: { 'Authorization': `Bearer ${your_auth_token}` },
    body: formData,
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ detail: 'Failed to analyze image and parse error response.' }));
    throw new Error(errorData.detail || `Error ${response.status}: ${response.statusText}`);
  }

  const result = await response.json();
  // As per current plan, backend returns chartJson. Validation happens on frontend.
  return { chartJson: result.chartJson };
};

// Helper function to transform FlowchartData to the format expected by validator.js
const transformFlowchartDataForValidation = (data: FlowchartData | null): any | null => {
  if (!data || !data.nodes || !data.edges) {
    return null;
  }

  let startBlockId: string | null = null;
  const blocks: any[] = data.nodes.map((node: FlowchartNode) => {
    const block: any = {
      id: node.id,
      type: node.type.charAt(0).toUpperCase() + node.type.slice(1), // e.g., 'start' -> 'Start'
      label: node.data.label,
      // Specific properties based on node type for validator.js
      operation: node.data.value, // For 'process'
      condition: node.data.condition, // For 'decision'
      variableName: node.type === 'input' ? node.data.label : undefined, // Crude assumption for input variable
      // promptText: for 'input' - not directly available in FlowchartNode.data in the same way
      // message: for 'output' - similar to promptText
    };

    if (node.type === 'start') {
      if (!startBlockId) { // Take the first start node encountered
        startBlockId = node.id;
      }
    }

    // Find outgoing edges for this node
    const outgoingEdges = data.edges.filter(edge => edge.source === node.id);

    if (node.type === 'decision') {
      const trueEdge = outgoingEdges.find(edge => edge.label?.toLowerCase() === 'yes' || edge.type === 'yes');
      const falseEdge = outgoingEdges.find(edge => edge.label?.toLowerCase() === 'no' || edge.type === 'no');
      // If no 'yes'/'no' labels, but there are two edges, assign them (less robust)
      // Or, if only one edge, it might be ambiguous for the old validator.
      // The old validator expects trueBlock and falseBlock.
      if (trueEdge) {
        block.trueBlock = trueEdge.target;
      }
      if (falseEdge) {
        block.falseBlock = falseEdge.target;
      }
      // If only one edge from decision, or unlabelled edges, this transformation might be insufficient
      // for the old validator's expectations. For now, this is a direct mapping.
      if (!trueEdge && !falseEdge && outgoingEdges.length > 0) {
        // If no specific yes/no, and there are edges, how to map?
        // The old validator is strict. Let's assume for now if not 'yes'/'no', it's ambiguous.
        // Or, take the first as 'true' and second as 'false' if two exist?
        // For now, only map explicit 'yes'/'no' or typed edges.
      }

    } else if (node.type !== 'end') { // For Start, Process, Input, Output, Loop (if loop has a single next)
      if (outgoingEdges.length === 1) {
        block.nextBlock = outgoingEdges[0].target;
      } else if (outgoingEdges.length > 1) {
        // Multiple non-decision outgoing edges - old validator might not handle this well.
        // For now, take the first one. This might need refinement.
        block.nextBlock = outgoingEdges[0].target;
        console.warn(`Node ${node.id} of type ${node.type} has multiple outgoing edges. Taking the first for 'nextBlock'.`);
      }
    }
    return block;
  });

  if (!startBlockId && data.nodes.length > 0) {
    const firstNode = data.nodes.find(n => n.type === 'start');
    if (firstNode) startBlockId = firstNode.id;
    // else if no start node, validator will catch it.
  }

  return { startBlockId, blocks };
};


export const useImportFlowchart = (): UseImportFlowchartReturn => {
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [chartJson, setChartJson] = useState<FlowchartData | null>(null);
  const [validationReport, setValidationReport] = useState<ValidationReportItem[] | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelected = useCallback(async (selectedFile: File) => {
    if (!selectedFile) return;

    setIsLoading(true);
    setError(null);
    setChartJson(null);
    setValidationReport(null);

    try {
      // 1. Call backend API
      const { chartJson: receivedChartJson } = await callAnalyzeFlowchartApi(selectedFile);
      setChartJson(receivedChartJson);

      // 2. Transform chartJson to the format expected by validator.js
      const validatorInput = transformFlowchartDataForValidation(receivedChartJson);

      // 3. Run validator.js
      if (validatorInput) {
        const reportFromEngine = engineValidateFlowchart(validatorInput, { checkExpressions: true });
        // The reportFromEngine is Array<object> with properties like id, message, type.
        // We need to map it to ValidationReportItem[]
        const formattedReport: ValidationReportItem[] = reportFromEngine.map((error: any) => ({
            id: error.id,
            message: error.message,
            // Ensure the type from validator.js (string) matches ValidationReportItem type
            type: error.type as ValidationReportItem['type']
        }));
        setValidationReport(formattedReport);
        console.log("useImportFlowchart: Validation report generated:", formattedReport);
      } else {
        // If transformation fails or data is unsuitable, set a basic report
        setValidationReport([{ message: "Imported data could not be processed for validation.", type: 'Critical' }]);
      }

    } catch (e: any) {
      console.error("Failed to import and analyze flowchart:", e);
      setError(e.message || 'An unknown error occurred during flowchart import.');
      setChartJson(null);
      setValidationReport(null);
    } finally {
      setIsLoading(false);
      // Reset file input to allow selecting the same file again
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  }, []); // Add dependencies if validator or other external functions are used directly here

  const triggerImport = useCallback(() => {
    // Create an input element dynamically if it doesn't exist,
    // or manage one provided by the component using this hook.
    // For simplicity, let's assume the component using this hook will render the input
    // and the hook will get a ref to it, or we create one dynamically.

    // Simpler approach: create input element on the fly
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.onchange = (event: Event) => {
      const target = event.target as HTMLInputElement;
      if (target.files && target.files[0]) {
        handleFileSelected(target.files[0]);
      }
    };
    input.click();
  }, [handleFileSelected]);

  const clearImportedData = useCallback(() => {
    setChartJson(null);
    setValidationReport(null);
    setError(null);
    setIsLoading(false);
    if (fileInputRef.current) {
        fileInputRef.current.value = '';
    }
  }, []);

  return {
    isLoading,
    error,
    chartJson,
    validationReport,
    triggerImport,
    clearImportedData,
  };
};
