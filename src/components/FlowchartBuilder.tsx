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
  //Upload,
  Zap,
  PanelLeft, // Added for palette toggle
  PanelRight, // Added for properties toggle
  Settings2, // Added for properties toggle
  Palette, // Added for palette toggle
  X, // For the close button on properties panel
  Upload // Added for image upload
} from 'lucide-react';
import { getDatabase, ref, update, serverTimestamp, onValue } from 'firebase/database'; // Added onValue
import { app } from '../firebaseConfig';
import { useAuth } from '../contexts/AuthContext';
import { User as UserIcon } from 'lucide-react'; // For default presence bubble avatar

// Define UserPresence structure (can be moved to types/index.ts later)
interface UserPresence {
  uid: string;
  displayName: string | null;
  photoURL: string | null;
  currentFlowchartId: string | null;
  currentNodeId: string | null;
  lastSeen: number;
  status: 'online' | 'idle' | 'offline';
}

interface FlowchartBuilderProps {
  exercise: Exercise;
  onGenerateCode: (flowchart: FlowchartData) => void;
  onRunCode: (code: string) => void;
  isRunning: boolean;
  newFlowchartToLoad?: FlowchartData | null; // New prop for AI generated flowcharts
  isGeneratingFlowchart?: boolean; // For spinner display
  highlightedNodeId?: string | null; // Added from previous context, ensure it's used or removed if not
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
  isRunning,
  newFlowchartToLoad,
  isGeneratingFlowchart, // Destructure the new prop
  highlightedNodeId
}) => {
  const { currentUser } = useAuth(); // Get current user for presence updates
  const [flowchartData, setFlowchartData] = useState<FlowchartData>({
    nodes: [],
    edges: []
  });
  const [selectedNodeForProperties, setSelectedNodeForProperties] = useState<string | null>(null); // Renamed for clarity
  const [isConnecting, setIsConnecting] = useState(false);
  const [connectionStart, setConnectionStart] = useState<string | null>(null);
  const [draggedNodeType, setDraggedNodeType] = useState<FlowchartNodeType | null>(null);
  const [generatedCode, setGeneratedCode] = useState<string>(''); // This seems to be local state, but generatedCode is also a prop in App.tsx
  const canvasRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null); // Ref for the hidden file input
  const [connectingMousePosition, setConnectingMousePosition] = useState<{ x: number; y: number } | null>(null);
  const [isPaletteOpen, setIsPaletteOpen] = useState(true); // Default open on larger screens
  const [isPropertiesOpen, setIsPropertiesOpen] = useState(true); // Default open on larger screens
  const [draggingNodeId, setDraggingNodeId] = useState<string | null>(null);
  const [dragOffset, setDragOffset] = useState<{ x: number; y: number } | null>(null);
  const didDragNodeRef = useRef(false);
  const [otherUsersOnFlowchart, setOtherUsersOnFlowchart] = useState<UserPresence[]>([]);

  // Effect to fetch other users' presence on the current flowchart
  useEffect(() => {
    if (!currentUser || !exercise) return;

    const db = getDatabase(app);
    const onlineUsersRef = ref(db, 'onlineUsers');
    const currentFlowchartIdForPresence = `exercise-${exercise.id}`;

    const unsubscribe = onValue(onlineUsersRef, (snapshot) => {
      const usersData = snapshot.val();
      if (usersData) {
        const usersList: UserPresence[] = Object.values(usersData)
          .filter((user): user is UserPresence =>
            user !== null &&
            typeof user === 'object' &&
            'uid' in user &&
            'status' in user &&
            'currentFlowchartId' in user &&
            (user as UserPresence).uid !== currentUser.uid &&
            (user as UserPresence).status === 'online' &&
            (user as UserPresence).currentFlowchartId === currentFlowchartIdForPresence
          )
          .map(user => user as UserPresence); // Map to UserPresence after filtering
        setOtherUsersOnFlowchart(usersList);
      } else {
        setOtherUsersOnFlowchart([]);
      }
    });

    return () => unsubscribe();
  }, [currentUser, exercise]);


  const handleDragEnd = useCallback(() => {
    if (draggingNodeId) {
      setFlowchartData(prev => ({
        ...prev,
        nodes: prev.nodes.map(n =>
          n.id === draggingNodeId ? { ...n, isDragging: false } : n
        ),
      }));
      setDraggingNodeId(null);
      setDragOffset(null);
    }
  }, [draggingNodeId, setFlowchartData, setDraggingNodeId, setDragOffset]);

  useEffect(() => {
    // This effect handles the case where the mouse is released outside the canvas or window
    if (draggingNodeId) {
      window.addEventListener('mouseup', handleDragEnd);
    }
    return () => {
      window.removeEventListener('mouseup', handleDragEnd);
    };
  }, [draggingNodeId, handleDragEnd]);

  // Helper function to validate and sanitize incoming flowchart data
  const validateAndSanitizeFlowchartData = (data: FlowchartData | null | undefined): { validatedData: FlowchartData, warnings: string[] } => {
    const warnings: string[] = [];
    if (!data || !data.nodes) {
      warnings.push("Received no flowchart data or nodes were missing; displaying an empty canvas.");
      return { validatedData: { nodes: [], edges: [] }, warnings };
    }

    const sanitizedNodes = (data.nodes || []).map((node, index) => {
      if (typeof node !== 'object' || node === null) {
        warnings.push(`Node at index ${index} was not a valid object and was skipped.`);
        return null; // Skip this node
      }

      const { id, type, position, data: nodeData } = node;
      let validatedType = type;
      let originalType = type;

      if (!id) warnings.push(`Node ${index + 1} was missing an ID; a new one was generated.`);
      if (!type) {
        warnings.push(`Node ${id || `(new ID for index ${index})`} was missing a type; defaulted to 'process'.`);
        validatedType = 'process';
      } else if (!nodePalette.some(p => p.type === type)) {
        warnings.push(`Node ${id || `(new ID for index ${index})`} had an invalid type '${type}'; defaulted to 'process'.`);
        validatedType = 'process';
      }
      if (!position || typeof position.x !== 'number' || typeof position.y !== 'number') {
        warnings.push(`Node ${id || type || `index ${index}`} was missing a valid position; defaulted to a random position.`);
      }
      if (!nodeData) {
        warnings.push(`Node ${id || type || `index ${index}`} was missing 'data' object; default data used.`);
      } else if (!nodeData.label) {
        warnings.push(`Node ${id || type || `index ${index}`} was missing a label; a default label was provided.`);
      }


      const validatedNode: FlowchartNode = {
        id: id || `node-validated-${Date.now()}-${index}`,
        type: validatedType as FlowchartNodeType,
        position: {
          x: typeof position?.x === 'number' ? position.x : Math.random() * 400,
          y: typeof position?.y === 'number' ? position.y : Math.random() * 300,
        },
        data: {
          label: nodeData?.label || `Node '${originalType || validatedType}' ${index + 1}`,
          value: nodeData?.value || '',
          condition: nodeData?.condition || '',
        },
        isDragging: false,
      };
      return validatedNode;
    }).filter(Boolean) as FlowchartNode[]; // Filter out null (skipped) nodes

    const nodeIds = new Set(sanitizedNodes.map(n => n.id));
    const sanitizedEdges = (data.edges || []).filter(edge => {
      if (typeof edge !== 'object' || edge === null) {
        warnings.push("An edge entry was not a valid object and was skipped.");
        return false;
      }
      if (!edge.id) warnings.push(`Edge was missing an ID; a new one will be generated if edge is kept.`);
      if (!edge.source || !nodeIds.has(edge.source)) {
        warnings.push(`Edge '${edge.id || 'unknown ID'}' removed: source node '${edge.source || 'missing'}' not found or invalid.`);
        return false;
      }
      if (!edge.target || !nodeIds.has(edge.target)) {
        warnings.push(`Edge '${edge.id || 'unknown ID'}' removed: target node '${edge.target || 'missing'}' not found or invalid.`);
        return false;
      }
      return true;
    }).map((edge, index) => ({
      id: edge.id || `edge-validated-${Date.now()}-${index}`,
      source: edge.source,
      target: edge.target,
      type: edge.type || 'default',
      label: edge.label || '',
    }));

    if (data.nodes.length > 0 && sanitizedNodes.length === 0) {
        warnings.push("All nodes in the provided flowchart data were invalid or unsupported.");
    }


    return { validatedData: { nodes: sanitizedNodes, edges: sanitizedEdges }, warnings };
  };

  useEffect(() => {
    if (newFlowchartToLoad !== undefined) { // Check if the prop is actually passed
      console.log('FlowchartBuilder: Received new flowchart to load via props:', newFlowchartToLoad);
      const { validatedData, warnings } = validateAndSanitizeFlowchartData(newFlowchartToLoad);

      console.log('FlowchartBuilder: Validated flowchart data:', validatedData);
      if (warnings.length > 0) {
        console.warn('FlowchartBuilder: Warnings during flowchart data validation:', warnings);
        warnings.forEach(warning => toast.warn(warning, { duration: 4000 }));
        if (validatedData.nodes.length === 0 && newFlowchartToLoad && newFlowchartToLoad.nodes && newFlowchartToLoad.nodes.length > 0) {
          toast.error("Failed to load any valid nodes from the generated flowchart.", { duration: 5000});
        } else if (newFlowchartToLoad === null || (newFlowchartToLoad && !newFlowchartToLoad.nodes)) {
           // This case is handled by the initial check in validateAndSanitizeFlowchartData
           // but we can add a specific toast if needed.
           // toast.error("Received empty or invalid flowchart data.", { duration: 5000 });
        }
      }

      setFlowchartData(validatedData);
      setSelectedNodeForProperties(null); // Reset selection

      // If, after validation, there are no nodes, but the original attempt had nodes,
      // it implies all nodes were invalid.
      if (validatedData.nodes.length === 0 && newFlowchartToLoad?.nodes && newFlowchartToLoad.nodes.length > 0) {
        // This message is now covered by the toast.error above.
        // addMessage for chat could be an option here if direct chat interaction is needed.
      }
    }
  }, [newFlowchartToLoad]); // Dependency array includes newFlowchartToLoad

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

  // Debounce function
  const debounce = <F extends (...args: any[]) => any>(func: F, waitFor: number) => {
    let timeout: ReturnType<typeof setTimeout> | null = null;

    const debounced = (...args: Parameters<F>) => {
      if (timeout !== null) {
        clearTimeout(timeout);
        timeout = null;
      }
      timeout = setTimeout(() => func(...args), waitFor);
    };

    return debounced as (...args: Parameters<F>) => ReturnType<F>;
  };

  // Effect to adjust panel visibility based on screen size using debounce
  useEffect(() => {
    const handleResizeInternal = () => {
      if (window.innerWidth < 768) { // md breakpoint
        setIsPaletteOpen(true); // Changed to true for palette to be open by default on small screens
        setIsPropertiesOpen(false);
      } else {
        setIsPaletteOpen(true);
        setIsPropertiesOpen(true);
      }
    };
    const debouncedResize = debounce(handleResizeInternal, 200);
    debouncedResize(); // Initial check
    window.addEventListener('resize', debouncedResize);
    return () => window.removeEventListener('resize', debouncedResize);
  }, []);

  // Effect to open properties panel when a node is selected
  useEffect(() => {
    if (selectedNodeForProperties) {
      setIsPropertiesOpen(true);
    }
  }, [selectedNodeForProperties]);


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
      position: { x: x - 64, y: y - 32 }, // Center the node on cursor
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

  const handleCanvasMouseMove = (e: React.MouseEvent) => {
    if (draggingNodeId && dragOffset && canvasRef.current) {
      const rect = canvasRef.current.getBoundingClientRect();
      const mouseXInCanvas = e.clientX - rect.left;
      const mouseYInCanvas = e.clientY - rect.top;

      const newNodeX = mouseXInCanvas - dragOffset.x;
      const newNodeY = mouseYInCanvas - dragOffset.y;

      setFlowchartData(prev => ({
        ...prev,
        nodes: prev.nodes.map(n =>
          n.id === draggingNodeId
            ? { ...n, position: { x: newNodeX, y: newNodeY } }
            : n
        )
      }));
      didDragNodeRef.current = true; // Mark that a drag occurred
      // No need to explicitly set isDragging here as it's managed by mousedown/mouseup
      // and styles can rely on draggingNodeId
    } else if (isConnecting && connectionStart && canvasRef.current) {
      const rect = canvasRef.current.getBoundingClientRect();
      setConnectingMousePosition({
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
      });
    } else if (connectingMousePosition) {
      // If not connecting anymore, and not dragging, clear the preview line position
      setConnectingMousePosition(null);
    }
  };

  const handleNodeMouseDown = (event: React.MouseEvent, nodeId: string) => {
    event.preventDefault();
    event.stopPropagation();
    didDragNodeRef.current = false; // Reset drag flag

    const node = flowchartData.nodes.find(n => n.id === nodeId);
    if (!node || !canvasRef.current) return;

    const canvasRect = canvasRef.current.getBoundingClientRect();
    const mouseXInCanvas = event.clientX - canvasRect.left;
    const mouseYInCanvas = event.clientY - canvasRect.top;

    const offsetX = mouseXInCanvas - node.position.x;
    const offsetY = mouseYInCanvas - node.position.y;

    setDraggingNodeId(nodeId);
    setDragOffset({ x: offsetX, y: offsetY });

    // Set isDragging on the node
    setFlowchartData(prev => ({
      ...prev,
      nodes: prev.nodes.map(n =>
        n.id === nodeId ? { ...n, isDragging: true } : n
      ),
    }));
  };

  const handleNodeClick = (nodeId: string) => {
    if (didDragNodeRef.current) {
      // If a drag just happened, don't process this click.
      // The ref will be reset on the next mousedown.
      return;
    }

  // Removed the potentially problematic redundant check.
  // The didDragNodeRef.current check above should be sufficient
  // to distinguish between a click and a drag-release.

    if (isConnecting) {
      if (!connectionStart) {
        // This is the first click in a connection sequence
        setConnectionStart(nodeId);
        // Visual feedback for line preview is handled by onMouseMove
      } else {
        // This is the second click
        if (connectionStart !== nodeId) {
          // Connecting to a different node
          const newEdge: FlowchartEdge = {
            id: `edge-${Date.now()}`,
            source: connectionStart,
            target: nodeId,
            type: 'default', // Consider edge types later if needed
          };
          setFlowchartData(prev => ({
            ...prev,
            edges: [...prev.edges, newEdge],
          }));
        }
        // Reset connection state whether an edge was created or not (e.g. clicked same node)
        setIsConnecting(false);
        setConnectionStart(null);
        setConnectingMousePosition(null); // Reset preview line
      }
    } else {
    // Not in connecting mode, so select the node for properties panel
    setSelectedNodeForProperties(nodeId);
  }

  // Update Firebase with the clicked node ID
  if (currentUser) {
    const db = getDatabase(app);
    const userPresenceRef = ref(db, `onlineUsers/${currentUser.uid}`);
    update(userPresenceRef, {
      currentNodeId: nodeId, // Set the currently selected node
      lastSeen: serverTimestamp()
    }).catch(error => {
      console.error("Error updating current node ID in presence:", error);
    });
  }
};

const handleCanvasClick = (event: React.MouseEvent) => {
  // If the click is on the canvas itself (not on a node or edge UI element)
  if (event.target === event.currentTarget) {
    setSelectedNodeForProperties(null); // Deselect node for properties panel

    // Clear current node ID in Firebase presence
    if (currentUser) {
      const db = getDatabase(app);
      const userPresenceRef = ref(db, `onlineUsers/${currentUser.uid}`);
      update(userPresenceRef, {
        currentNodeId: null,
        lastSeen: serverTimestamp()
      }).catch(error => {
        console.error("Error clearing current node ID in presence:", error);
      });
    }
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
  setSelectedNodeForProperties(null);

  // If the deleted node was the one the user had selected for presence, clear it
  if (currentUser) {
    const db = getDatabase(app);
    const userPresenceRef = ref(db, `onlineUsers/${currentUser.uid}`);
    // Check if this node was the one in presence, then clear.
    // This requires knowing the current presence state or just clearing,
    // for simplicity, we can just send an update to nullify if it was this node.
    // A more robust way would be to read the presence state first or ensure App.tsx handles this.
    // For now, let's assume if a node is deleted, it's no longer the "current" one.
    // This might conflict if App.tsx also tries to set it based on `currentExerciseId` change.
    // Let's refine: only clear if the deleted node IS the one in selection.
    // The selection for properties panel (`selectedNodeForProperties`) is a good client-side proxy.
    if (selectedNodeForProperties === nodeId) {
       update(userPresenceRef, {
        currentNodeId: null,
        lastSeen: serverTimestamp()
      }).catch(error => {
        console.error("Error clearing current node ID in presence after delete:", error);
      });
    }
  }
};

const handleImageFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
  const file = event.target.files?.[0];
  if (!file) {
    return;
  }

  console.log("Image file selected:", file.name, file.type);

  const formData = new FormData();
  formData.append('file', file);

  const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';
  const endpoint = `${apiBaseUrl}/api/import-image`;

  console.log(`Attempting to upload image to: ${endpoint}`);

  try {
    const response = await fetch(endpoint, {
      method: 'POST',
      body: formData,
      // Headers like 'Content-Type': 'multipart/form-data' are usually set automatically by the browser with FormData
    });

    if (!response.ok) {
      // Try to parse error from backend
      let errorDetail = `Error ${response.status}: ${response.statusText}`;
      try {
        const errorData = await response.json();
        errorDetail = errorData.detail || errorDetail;
      } catch (e) {
        // Ignore if error response is not JSON
      }
      alert(`Failed to import flowchart: ${errorDetail}`);
      return;
    }

    const apiResponse: {
      nodes: Array<{ id: string; type: FlowchartNodeType; label: string; x: number; y: number; width: number; height: number }>; // Backend Node
      edges: Array<{ id: string; source: string; target: string; label?: string }>; // Backend Edge
      error?: string;
      fallback_used?: boolean;
    } = await response.json();

    if (apiResponse.fallback_used && apiResponse.error) {
      alert(`Import Alert: ${apiResponse.error}`); // Show fallback toast
    }

    // Transform API nodes and edges to frontend FlowchartData structure
    const feNodes: FlowchartNode[] = apiResponse.nodes.map(apiNode => ({
      id: apiNode.id,
      type: apiNode.type, // Assuming backend type is already compatible FlowchartNodeType
      position: { x: apiNode.x, y: apiNode.y },
      data: { label: apiNode.label },
      // width and height from apiNode are ignored for now, as frontend nodes have fixed size
    }));

    const feEdges: FlowchartEdge[] = apiResponse.edges.map(apiEdge => ({
      id: apiEdge.id,
      source: apiEdge.source,
      target: apiEdge.target,
      label: apiEdge.label,
      type: 'default', // Defaulting edge type, can be enhanced if API provides it
    }));

    const newFlowchartData: FlowchartData = { nodes: feNodes, edges: feEdges };

    console.log("Received data from API, transformed for frontend:", newFlowchartData);
    updateFlowchartDataWithMLOutput(newFlowchartData);

  } catch (error) {
    console.error("Error importing image:", error);
    alert(`An unexpected error occurred: ${error instanceof Error ? error.message : String(error)}`);
  } finally {
    // Reset file input to allow selecting the same file again if needed
    if (event.target) {
      event.target.value = '';
    }
  }
};

const updateFlowchartDataWithMLOutput = (data: FlowchartData) => {
  console.log("Updating flowchart with data from API/ML:", data);
  setFlowchartData(data);
  setSelectedNodeForProperties(null); // Deselect any currently selected node
  // Optionally, trigger code generation if that's desired after import
  onGenerateCode(data); // This will call handleFlowchartChange in App.tsx
};

const triggerImageUpload = () => {
  fileInputRef.current?.click();
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
  setSelectedNodeForProperties(null);
  setGeneratedCode('');
  setConnectingMousePosition(null);
  // Clear current node ID in Firebase presence when canvas is cleared
  if (currentUser) {
    const db = getDatabase(app);
    const userPresenceRef = ref(db, `onlineUsers/${currentUser.uid}`);
    update(userPresenceRef, {
      currentNodeId: null,
      lastSeen: serverTimestamp()
    }).catch(error => {
      console.error("Error clearing current node ID on canvas clear:", error);
    });
  }
};

const getNodeStyle = (nodeType: FlowchartNodeType) => {
  const palette = nodePalette.find(p => p.type === nodeType);
  return palette?.color || 'bg-gray-100 border-gray-300 text-gray-800';
};

const selectedNodeDataForProperties = selectedNodeForProperties
  ? flowchartData.nodes.find(node => node.id === selectedNodeForProperties)
  : null;

  // Props for FlowchartBuilder in App.tsx likely needs to be updated
  // for onNodeClick, onPaneClick, etc. if we were using ReactFlow directly.
  // Since this is a custom builder, we add click handler to the canvas div.

  return (
    <div className="bg-white rounded-lg border border-gray-200 h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-2 sm:p-4 border-b border-gray-200">
        <div className="flex items-center flex-shrink-0"> {/* Added flex-shrink-0 to title container */}
          <button
            onClick={() => setIsPaletteOpen(!isPaletteOpen)}
            className="p-1.5 hover:bg-gray-200 rounded-md mr-1 sm:mr-2 md:hidden" // Hidden on md and above
            title={isPaletteOpen ? "Hide Palette" : "Show Palette"}
          >
            <Palette size={20} />
          </button>
          <Zap className="w-5 h-5 text-blue-600 mr-1 sm:mr-2" />
          <h3 className="text-base sm:text-lg font-semibold text-gray-900 truncate">Interactive Flowchart Builder</h3>
        </div>
        
        <div className="flex items-center flex-wrap justify-end space-x-1 sm:space-x-2 ml-2"> {/* Added flex-wrap and justify-end, reduced ml */}
          <button
            onClick={() => {
              const newIsConnecting = !isConnecting;
              setIsConnecting(newIsConnecting);
              if (!newIsConnecting) { // If we are turning connecting mode OFF
                setConnectionStart(null);
                setConnectingMousePosition(null);
              }
            }}
            className={`px-2 sm:px-3 py-1 sm:py-1.5 text-xs sm:text-sm rounded-md transition-colors ${
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
            className="flex items-center px-2 sm:px-3 py-1 sm:py-1.5 text-xs sm:text-sm text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <Zap className="w-3 h-3 sm:w-4 sm:h-4 mr-1" />
            Generate Code
          </button>
          
          <button
            onClick={() => onRunCode(generatedCode)}
            disabled={!generatedCode || isRunning}
            className="flex items-center px-2 sm:px-3 py-1 sm:py-1.5 text-xs sm:text-sm text-white bg-emerald-600 rounded-md hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <Play className="w-3 h-3 sm:w-4 sm:h-4 mr-1" />
            {isRunning ? 'Running...' : 'Run'}
          </button>
          
          <button
            onClick={clearCanvas}
            className="flex items-center px-2 sm:px-3 py-1 sm:py-1.5 text-xs sm:text-sm text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors"
          >
            <RotateCcw className="w-3 h-3 sm:w-4 sm:h-4 mr-1" />
            Clear
          </button>
          {/* Image Upload Button */}
          <button
            onClick={triggerImageUpload}
            className="flex items-center px-2 sm:px-3 py-1 sm:py-1.5 text-xs sm:text-sm text-white bg-teal-600 rounded-md hover:bg-teal-700 transition-colors"
            title="Upload Flowchart Image"
          >
            <Upload className="w-3 h-3 sm:w-4 sm:h-4 mr-1" />
            Import
          </button>
          <input
            type="file"
            ref={fileInputRef}
            accept="image/jpeg, image/png"
            onChange={handleImageFileSelect}
            data-testid="flowchart-image-upload-input"
            className="hidden"
          />
          <button
            onClick={() => setIsPropertiesOpen(!isPropertiesOpen)}
            className="p-1.5 hover:bg-gray-200 rounded-md ml-1 sm:ml-2 md:hidden" // Hidden on md and above
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
            className="w-full h-full bg-gray-50 relative flowchart-dots-bg"
            onDragOver={handleDragOver}
            onDrop={handleDrop}
            onMouseMove={handleCanvasMouseMove}
            onMouseUp={handleDragEnd}
            onClick={handleCanvasClick} // Added to handle clicks on canvas background
            // onMouseLeave={handleDragEnd} // Removed this line as it might prematurely end drags
          >
            {isGeneratingFlowchart && (
              <div className="absolute inset-0 bg-gray-500 bg-opacity-50 flex items-center justify-center z-50">
                <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-blue-500"></div>
                <p className="ml-3 text-white font-semibold">Generating Flowchart...</p>
              </div>
            )}
            {/* Render Edges */}
            <svg className="absolute inset-0 w-full h-full pointer-events-none">
              {isConnecting && connectionStart && connectingMousePosition && (() => {
                const sourceNode = flowchartData.nodes.find(n => n.id === connectionStart);
                if (!sourceNode || !sourceNode.position) return null; // Guard against missing position
                const x1 = sourceNode.position.x + 64;
                const y1 = sourceNode.position.y + 32;
                return (
                  <line
                    x1={x1}
                    y1={y1}
                    x2={connectingMousePosition.x}
                    y2={connectingMousePosition.y}
                    stroke="#2563eb" // A distinct color like blue
                    strokeWidth="2"
                    strokeDasharray="5,5" // Make it a dashed line
                  />
                );
              })()}
              {flowchartData.edges.map((edge) => {
                const sourceNode = flowchartData.nodes.find(n => n.id === edge.source);
                const targetNode = flowchartData.nodes.find(n => n.id === edge.target);
                
                // Guard against missing nodes or their positions
                if (!sourceNode || !sourceNode.position || !targetNode || !targetNode.position) {
                  console.error("FlowchartBuilder: Skipping edge render due to missing source/target node or position", edge, sourceNode, targetNode);
                  return null;
                }

                const x1 = sourceNode.position.x + 64;
                const y1 = sourceNode.position.y + 32;
                const x2 = targetNode.position.x + 64;
                const y2 = targetNode.position.y + 32;

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
            {flowchartData.nodes.map((node) => {
              // Guard against missing position and provide defaults
              const positionX = typeof node.position?.x === 'number' ? node.position.x : 0;
              const positionY = typeof node.position?.y === 'number' ? node.position.y : 0;
              if (typeof node.position?.x !== 'number' || typeof node.position?.y !== 'number') {
                console.error("FlowchartBuilder: Node missing valid position, defaulting to (0,0). Node data:", node);
              }

              return (
              <div
                key={node.id}
                className={`absolute w-32 h-16 rounded-lg border-2 cursor-pointer transition-all hover:shadow-lg z-20 ${ // Added z-20
                  getNodeStyle(node.type)
                } ${selectedNodeForProperties === node.id ? 'ring-2 ring-blue-500 ring-offset-2' : ''}
                   ${highlightedNodeId === node.id ? 'ring-4 ring-purple-500 ring-offset-2' : ''} // Highlight for dry run/presence
                `}
                style={{
                  left: positionX,
                  top: positionY,
                  transform: node.type === 'decision' ? 'rotate(45deg)' : 'none',
                  cursor: draggingNodeId === node.id ? 'grabbing' : 'grab' // Visual feedback for dragging
                }}
                onClick={() => handleNodeClick(node.id)}
                onMouseDown={(e) => handleNodeMouseDown(e, node.id)}
              >
                <div className={`w-full h-full flex items-center justify-center p-2 ${
                  node.type === 'decision' ? 'transform -rotate-45' : ''
                }`} title={node.data?.label || 'Untitled Node'} // Show full label on hover, with fallback
                >
                  <span className="text-xs font-medium text-center leading-tight block truncate overflow-hidden text-ellipsis">
                    {node.data?.label || 'Untitled Node'} {/* Fallback for display */}
                  </span>
                </div>
                
                {selectedNodeForProperties === node.id && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation(); // Prevent node click from firing again
                      handleDeleteNode(node.id);
                    }}
                    className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600 transition-colors z-30" // Ensure delete button is on top
                    title="Delete node"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                )}
              </div>
               );
            })}


            {/* Render Presence Bubbles for other users */}
            {otherUsersOnFlowchart.map(user => {
              if (!user.currentNodeId) return null;
              const targetNode = flowchartData.nodes.find(n => n.id === user.currentNodeId);
              // Guard against missing targetNode or its position
              if (!targetNode || !targetNode.position) return null;

              const positionX = typeof targetNode.position?.x === 'number' ? targetNode.position.x : 0;
              const positionY = typeof targetNode.position?.y === 'number' ? targetNode.position.y : 0;

              // Position bubble slightly offset from the target node (e.g., top-right corner)
              // Node dimensions: w-32 (128px), h-16 (64px)
              const bubbleX = positionX + 128 - 8; // Node width - half bubble width approx
              const bubbleY = positionY - 8;      // Half bubble height approx above node

              return (
                <div
                  key={user.uid}
                  className="absolute w-7 h-7 rounded-full flex items-center justify-center border-2 border-white shadow-lg z-30"
                  style={{
                    left: bubbleX,
                    top: bubbleY,
                    backgroundColor: user.photoURL ? undefined : '#A0AEC0', // Default gray if no photo
                  }}
                  title={user.displayName || 'User'}
                >
                  {user.photoURL ? (
                    <img src={user.photoURL} alt={user.displayName || ''} className="w-full h-full rounded-full object-cover" />
                  ) : (
                    <UserIcon size={14} className="text-white" />
                  )}
                </div>
              );
            })}

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
        {selectedNodeDataForProperties && isPropertiesOpen && (
          <div
            className={`border-l border-gray-200 p-4 flex-shrink-0 bg-white
                        w-full sm:w-60 md:w-72 lg:w-80
                        absolute sm:relative right-0 sm:right-auto z-10 sm:z-0 h-full sm:h-auto overflow-y-auto sm:overflow-y-visible
                        ${isPropertiesOpen ? 'block' : 'hidden'}`}
          >
            <div className="flex justify-between items-center mb-4">
              <h4 className="text-sm font-semibold text-gray-900">Node Properties</h4>
              <button
                onClick={() => {
                  setSelectedNodeForProperties(null);
                  // Also clear from Firebase presence if user explicitly closes properties for a node
                  if (currentUser) {
                    const db = getDatabase(app);
                    const userPresenceRef = ref(db, `onlineUsers/${currentUser.uid}`);
                    update(userPresenceRef, {
                      currentNodeId: null,
                      lastSeen: serverTimestamp()
                    }).catch(error => console.error("Error clearing node on prop close:", error));
                  }
                }}
                className="p-1 hover:bg-gray-200 rounded-md text-gray-600 hover:text-gray-800"
                title="Close Properties"
              >
                <X size={18} /> {/* Using lucide-react X icon */}
              </button>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Label
                </label>
                <input
                  type="text"
                  value={selectedNodeDataForProperties.data.label}
                  onChange={(e) => handleNodeUpdate(selectedNodeDataForProperties!.id, { label: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              {(selectedNodeDataForProperties.type === 'process' || selectedNodeDataForProperties.type === 'output') && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {selectedNodeDataForProperties.type === 'process' ? 'Expression' : 'Output Value'}
                  </label>
                  <textarea
                    value={selectedNodeDataForProperties.data.value || ''}
                    onChange={(e) => handleNodeUpdate(selectedNodeDataForProperties!.id, { value: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    rows={3}
                    placeholder={selectedNodeDataForProperties.type === 'process' ? 'e.g., sum = a + b' : 'e.g., sum'}
                  />
                </div>
              )}

              {selectedNodeDataForProperties.type === 'decision' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Condition
                  </label>
                  <input
                    type="text"
                    value={selectedNodeDataForProperties.data.condition || ''}
                    onChange={(e) => handleNodeUpdate(selectedNodeDataForProperties!.id, { condition: e.target.value })}
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