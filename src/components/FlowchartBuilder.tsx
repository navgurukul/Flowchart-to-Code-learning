import React, { useState, useCallback, useRef, useEffect } from 'react';
import { Exercise, FlowchartNode, FlowchartEdge, FlowchartData, FlowchartNodeType } from '../types/index';
import { 
  Play, 
  Square, 
  Circle, 
  Diamond, 
  ArrowRight, 
  Trash2, 
  RotateCcw,
  Save,
  Download,
  Upload,
  Zap,
  PanelLeft, // Added for palette toggle
  PanelRight, // Added for properties toggle
  Settings2, // Added for properties toggle
  Palette // Added for palette toggle
} from 'lucide-react';

interface FlowchartBuilderProps {
  exercise: Exercise;
  onGenerateCode: (flowchart: FlowchartData) => void;
  onRunCode: (code: string) => void;
  isRunning: boolean;
}

interface NodePalette {
  type: FlowchartNodeType;
  label: string;
  icon: React.ReactNode;
  color: string;
  description: string;
}

const nodePalette: NodePalette[] = [
  {
    type: 'start',
    label: 'Start',
    icon: <Circle className="w-4 h-4" />,
    color: 'bg-emerald-100 border-emerald-300 text-emerald-800',
    description: 'Beginning of the flowchart'
  },
  {
    type: 'end',
    label: 'End',
    icon: <Circle className="w-4 h-4" />,
    color: 'bg-red-100 border-red-300 text-red-800',
    description: 'End of the flowchart'
  },
  {
    type: 'process',
    label: 'Process',
    icon: <Square className="w-4 h-4" />,
    color: 'bg-blue-100 border-blue-300 text-blue-800',
    description: 'Processing step or calculation'
  },
  {
    type: 'decision',
    label: 'Decision',
    icon: <Diamond className="w-4 h-4" />,
    color: 'bg-orange-100 border-orange-300 text-orange-800',
    description: 'Conditional branching'
  },
  {
    type: 'input',
    label: 'Input',
    icon: <ArrowRight className="w-4 h-4 rotate-180" />,
    color: 'bg-purple-100 border-purple-300 text-purple-800',
    description: 'Data input operation'
  },
  {
    type: 'output',
    label: 'Output',
    icon: <ArrowRight className="w-4 h-4" />,
    color: 'bg-indigo-100 border-indigo-300 text-indigo-800',
    description: 'Data output operation'
  },
  {
    type: 'loop',
    label: 'Loop',
    icon: <div className="w-4 h-4 border-2 border-current rounded-full" />,
    color: 'bg-yellow-100 border-yellow-300 text-yellow-800',
    description: 'Repetitive operation'
  }
];

export const FlowchartBuilder: React.FC<FlowchartBuilderProps> = ({
  exercise,
  onGenerateCode,
  onRunCode,
  isRunning
}) => {
  const [flowchartData, setFlowchartData] = useState<FlowchartData>({
    nodes: [],
    edges: []
  });
  const [selectedNode, setSelectedNode] = useState<string | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [connectionStart, setConnectionStart] = useState<string | null>(null);
  const [draggedNodeType, setDraggedNodeType] = useState<FlowchartNodeType | null>(null);
  const [generatedCode, setGeneratedCode] = useState<string>(''); // This seems to be local state, but generatedCode is also a prop in App.tsx
  const canvasRef = useRef<HTMLDivElement>(null);
  const [isPaletteOpen, setIsPaletteOpen] = useState(true); // Default open on larger screens
  const [isPropertiesOpen, setIsPropertiesOpen] = useState(true); // Default open on larger screens

  // Effect to adjust panel visibility based on screen size
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 768) { // md breakpoint
        setIsPaletteOpen(false);
        setIsPropertiesOpen(false);
      } else {
        setIsPaletteOpen(true);
        setIsPropertiesOpen(true);
      }
    };
    handleResize(); // Initial check
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);


  const handleDragStart = (nodeType: FlowchartNodeType) => {
    setDraggedNodeType(nodeType);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (!draggedNodeType || !canvasRef.current) return;

    const rect = canvasRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const newNode: FlowchartNode = {
      id: `node-${Date.now()}`,
      type: draggedNodeType,
      position: { x: x - 60, y: y - 30 }, // Center the node on cursor
      data: {
        label: draggedNodeType.charAt(0).toUpperCase() + draggedNodeType.slice(1),
        value: ''
      }
    };

    setFlowchartData(prev => ({
      ...prev,
      nodes: [...prev.nodes, newNode]
    }));

    setDraggedNodeType(null);
  };

  const handleNodeClick = (nodeId: string) => {
    if (isConnecting && connectionStart && connectionStart !== nodeId) {
      // Create connection
      const newEdge: FlowchartEdge = {
        id: `edge-${Date.now()}`,
        source: connectionStart,
        target: nodeId,
        type: 'default'
      };

      setFlowchartData(prev => ({
        ...prev,
        edges: [...prev.edges, newEdge]
      }));

      setIsConnecting(false);
      setConnectionStart(null);
    } else if (isConnecting) {
      setConnectionStart(nodeId);
    } else {
      setSelectedNode(nodeId);
    }
  };

  const handleNodeUpdate = (nodeId: string, updates: Partial<FlowchartNode['data']>) => {
    setFlowchartData(prev => ({
      ...prev,
      nodes: prev.nodes.map(node =>
        node.id === nodeId
          ? { ...node, data: { ...node.data, ...updates } }
          : node
      )
    }));
  };

  const handleDeleteNode = (nodeId: string) => {
    setFlowchartData(prev => ({
      nodes: prev.nodes.filter(node => node.id !== nodeId),
      edges: prev.edges.filter(edge => edge.source !== nodeId && edge.target !== nodeId)
    }));
    setSelectedNode(null);
  };

  const handleDeleteEdge = (edgeId: string) => {
    setFlowchartData(prev => ({
      ...prev,
      edges: prev.edges.filter(edge => edge.id !== edgeId)
    }));
  };

  const generateCodeFromFlowchart = () => {
    const code = convertFlowchartToCode(flowchartData);
    setGeneratedCode(code);
    onGenerateCode(flowchartData);
  };

  const convertFlowchartToCode = (data: FlowchartData): string => {
    // Simple code generation logic
    let code = 'function solution(';
    
    // Find input nodes to determine parameters
    const inputNodes = data.nodes.filter(node => node.type === 'input');
    const params = inputNodes.map((_, index) => `input${index + 1}`).join(', ');
    code += params + ') {\n';

    // Add variable declarations
    inputNodes.forEach((node, index) => {
      code += `  let ${node.data.label.toLowerCase().replace(/\s+/g, '')} = input${index + 1};\n`;
    });

    // Process nodes in order
    const processNodes = data.nodes.filter(node => node.type === 'process');
    processNodes.forEach(node => {
      if (node.data.value) {
        code += `  ${node.data.value}\n`;
      }
    });

    // Find output nodes
    const outputNodes = data.nodes.filter(node => node.type === 'output');
    if (outputNodes.length > 0) {
      const outputValue = outputNodes[0].data.value || outputNodes[0].data.label;
      code += `  return ${outputValue};\n`;
    }

    code += '}';
    return code;
  };

  const clearCanvas = () => {
    setFlowchartData({ nodes: [], edges: [] });
    setSelectedNode(null);
    setGeneratedCode('');
  };

  const getNodeStyle = (nodeType: FlowchartNodeType) => {
    const palette = nodePalette.find(p => p.type === nodeType);
    return palette?.color || 'bg-gray-100 border-gray-300 text-gray-800';
  };

  const selectedNodeData = selectedNode 
    ? flowchartData.nodes.find(node => node.id === selectedNode)
    : null;

  return (
    <div className="bg-white rounded-lg border border-gray-200 h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200">
        <div className="flex items-center">
          <button
            onClick={() => setIsPaletteOpen(!isPaletteOpen)}
            className="p-1.5 hover:bg-gray-200 rounded-md mr-2 md:hidden" // Hidden on md and above
            title={isPaletteOpen ? "Hide Palette" : "Show Palette"}
          >
            <Palette size={20} />
          </button>
          <Zap className="w-5 h-5 text-blue-600 mr-2" />
          <h3 className="text-lg font-semibold text-gray-900">Interactive Flowchart Builder</h3>
        </div>
        
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setIsConnecting(!isConnecting)}
            className={`px-3 py-1.5 text-sm rounded-md transition-colors ${
              isConnecting 
                ? 'bg-orange-100 text-orange-700 border border-orange-300' 
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            {isConnecting ? 'Connecting...' : 'Connect Nodes'}
          </button>
          
          <button
            onClick={generateCodeFromFlowchart}
            disabled={flowchartData.nodes.length === 0}
            className="flex items-center px-3 py-1.5 text-sm text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <Zap className="w-4 h-4 mr-1" />
            Generate Code
          </button>
          
          <button
            onClick={() => onRunCode(generatedCode)}
            disabled={!generatedCode || isRunning}
            className="flex items-center px-3 py-1.5 text-sm text-white bg-emerald-600 rounded-md hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <Play className="w-4 h-4 mr-1" />
            {isRunning ? 'Running...' : 'Run'}
          </button>
          
          <button
            onClick={clearCanvas}
            className="flex items-center px-3 py-1.5 text-sm text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors"
          >
            <RotateCcw className="w-4 h-4 mr-1" />
            Clear
          </button>
          <button
            onClick={() => setIsPropertiesOpen(!isPropertiesOpen)}
            className="p-1.5 hover:bg-gray-200 rounded-md ml-2 md:hidden" // Hidden on md and above
            title={isPropertiesOpen ? "Hide Properties" : "Show Properties"}
          >
            <Settings2 size={20} />
          </button>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden"> {/* Added overflow-hidden */}
        {/* Node Palette */}
        {isPaletteOpen && (
          <div
            className={`border-r border-gray-200 p-4 flex-shrink-0 bg-white
                        w-full sm:w-48 md:w-56 lg:w-64
                        absolute sm:relative z-10 sm:z-0 h-full sm:h-auto overflow-y-auto sm:overflow-y-visible
                        ${isPaletteOpen ? 'block' : 'hidden'}`}
          >
            <h4 className="text-sm font-semibold text-gray-900 mb-4">Flowchart Elements</h4>
            <div className="space-y-2">
              {nodePalette.map((node) => (
                <div
                  key={node.type}
                  draggable
                  onDragStart={() => handleDragStart(node.type)}
                  className={`p-3 rounded-lg border-2 border-dashed cursor-move transition-all hover:shadow-md ${node.color}`}
                >
                  <div className="flex items-center mb-1">
                    {node.icon}
                    <span className="ml-2 font-medium text-sm">{node.label}</span>
                  </div>
                  <p className="text-xs opacity-75">{node.description}</p>
                </div>
              ))}
            </div>

            {/* Required Nodes Checklist */}
            {exercise.requiredNodes && (
              <div className="mt-6 p-3 bg-blue-50 rounded-lg border border-blue-200">
                <h5 className="text-sm font-semibold text-blue-900 mb-2">Required Elements</h5>
                <div className="space-y-1">
                  {exercise.requiredNodes.map((nodeType) => {
                    const hasNode = flowchartData.nodes.some(node => node.type === nodeType);
                    return (
                      <div key={nodeType} className="flex items-center text-xs">
                        <div className={`w-2 h-2 rounded-full mr-2 ${
                          hasNode ? 'bg-emerald-500' : 'bg-gray-300'
                        }`} />
                        <span className={hasNode ? 'text-emerald-700' : 'text-gray-600'}>
                          {nodeType.charAt(0).toUpperCase() + nodeType.slice(1)}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Canvas */}
        <div className="flex-1 relative"> {/* This is the key for the canvas to take remaining space */}
          <div
            ref={canvasRef}
            className="w-full h-full bg-gray-50 relative overflow-hidden"
            onDragOver={handleDragOver}
            onDrop={handleDrop}
            style={{
              backgroundImage: 'radial-gradient(circle, #e5e7eb 1px, transparent 1px)',
              backgroundSize: '20px 20px'
            }}
          >
            {/* Render Edges */}
            <svg className="absolute inset-0 w-full h-full pointer-events-none">
              {flowchartData.edges.map((edge) => {
                const sourceNode = flowchartData.nodes.find(n => n.id === edge.source);
                const targetNode = flowchartData.nodes.find(n => n.id === edge.target);
                
                if (!sourceNode || !targetNode) return null;

                const x1 = sourceNode.position.x + 60;
                const y1 = sourceNode.position.y + 30;
                const x2 = targetNode.position.x + 60;
                const y2 = targetNode.position.y + 30;

                return (
                  <g key={edge.id}>
                    <line
                      x1={x1}
                      y1={y1}
                      x2={x2}
                      y2={y2}
                      stroke="#6b7280"
                      strokeWidth="2"
                      markerEnd="url(#arrowhead)"
                    />
                    <circle
                      cx={(x1 + x2) / 2}
                      cy={(y1 + y2) / 2}
                      r="8"
                      fill="white"
                      stroke="#ef4444"
                      strokeWidth="1"
                      className="cursor-pointer pointer-events-auto"
                      onClick={() => handleDeleteEdge(edge.id)}
                    >
                      <title>Click to delete connection</title>
                    </circle>
                    <text
                      x={(x1 + x2) / 2}
                      y={(y1 + y2) / 2 + 1}
                      textAnchor="middle"
                      className="text-xs fill-red-600 pointer-events-none"
                    >
                      ×
                    </text>
                  </g>
                );
              })}
              <defs>
                <marker
                  id="arrowhead"
                  markerWidth="10"
                  markerHeight="7"
                  refX="9"
                  refY="3.5"
                  orient="auto"
                >
                  <polygon
                    points="0 0, 10 3.5, 0 7"
                    fill="#6b7280"
                  />
                </marker>
              </defs>
            </svg>

            {/* Render Nodes */}
            {flowchartData.nodes.map((node) => (
              <div
                key={node.id}
                className={`absolute w-32 h-16 rounded-lg border-2 cursor-pointer transition-all hover:shadow-lg ${
                  getNodeStyle(node.type)
                } ${selectedNode === node.id ? 'ring-2 ring-blue-500 ring-offset-2' : ''}`}
                style={{
                  left: node.position.x,
                  top: node.position.y,
                  transform: node.type === 'decision' ? 'rotate(45deg)' : 'none'
                }}
                onClick={() => handleNodeClick(node.id)}
              >
                <div className={`w-full h-full flex items-center justify-center p-2 ${
                  node.type === 'decision' ? 'transform -rotate-45' : ''
                }`} title={node.data.label} // Show full label on hover
                >
                  <span className="text-xs font-medium text-center leading-tight block truncate overflow-hidden text-ellipsis">
                    {node.data.label}
                  </span>
                </div>
                
                {selectedNode === node.id && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteNode(node.id);
                    }}
                    className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600 transition-colors"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                )}
              </div>
            ))}

            {/* Instructions */}
            {flowchartData.nodes.length === 0 && (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center text-gray-500">
                  <Zap className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p className="text-lg font-medium mb-2">Start Building Your Flowchart</p>
                  <p className="text-sm">Drag elements from the left panel to create your flowchart</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Properties Panel */}
        {selectedNodeData && isPropertiesOpen && (
          <div
            className={`border-l border-gray-200 p-4 flex-shrink-0 bg-white
                        w-full sm:w-60 md:w-72 lg:w-80
                        absolute sm:relative right-0 sm:right-auto z-10 sm:z-0 h-full sm:h-auto overflow-y-auto sm:overflow-y-visible
                        ${isPropertiesOpen ? 'block' : 'hidden'}`}
          >
            <h4 className="text-sm font-semibold text-gray-900 mb-4">Node Properties</h4>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Label
                </label>
                <input
                  type="text"
                  value={selectedNodeData.data.label}
                  onChange={(e) => handleNodeUpdate(selectedNode!, { label: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              {(selectedNodeData.type === 'process' || selectedNodeData.type === 'output') && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {selectedNodeData.type === 'process' ? 'Expression' : 'Output Value'}
                  </label>
                  <textarea
                    value={selectedNodeData.data.value || ''}
                    onChange={(e) => handleNodeUpdate(selectedNode!, { value: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    rows={3}
                    placeholder={selectedNodeData.type === 'process' ? 'e.g., sum = a + b' : 'e.g., sum'}
                  />
                </div>
              )}

              {selectedNodeData.type === 'decision' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Condition
                  </label>
                  <input
                    type="text"
                    value={selectedNodeData.data.condition || ''}
                    onChange={(e) => handleNodeUpdate(selectedNode!, { condition: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="e.g., n % 2 == 0"
                  />
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Generated Code Preview - This might need to be reviewed if generatedCode is also a prop */}
      {generatedCode && (
        <div className="border-t border-gray-200 p-4 bg-gray-50">
          <h4 className="text-sm font-semibold text-gray-900 mb-2">Generated Code</h4>
          <pre className="text-xs bg-white p-3 rounded border overflow-x-auto">
            <code>{generatedCode}</code>
          </pre>
        </div>
      )}
    </div>
  );
};