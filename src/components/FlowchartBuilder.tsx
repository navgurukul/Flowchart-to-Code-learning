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
  Upload, // Added for image upload
  ZoomIn, // For Zoom In button
  ZoomOut, // For Zoom Out button
  RefreshCcw // For Reset Zoom button
} from 'lucide-react';
import { getDatabase, ref, set, get, child, update, serverTimestamp, onValue } from 'firebase/database'; // Added 'set', 'get', 'child'
import { app } from '../firebaseConfig';
import { useAuth } from '../contexts/AuthContext';
import { User as UserIcon } from 'lucide-react'; // For default presence bubble avatar
import { ConditionChoiceModal } from './ConditionChoiceModal'; // Import the new modal

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
    icon: <Circle className="w-5 h-5" />,
    color: 'bg-emerald-100 border-emerald-300 text-emerald-800',
    description: 'Beginning of the flowchart'
  },
  {
    type: 'end',
    label: 'End',
    icon: <Circle className="w-5 h-5" />,
    color: 'bg-red-100 border-red-300 text-red-800',
    description: 'End of the flowchart'
  },
  {
    type: 'process',
    label: 'Process',
    icon: <Square className="w-5 h-5" />,
    color: 'bg-blue-100 border-blue-300 text-blue-800',
    description: 'Processing step or calculation'
  },
  {
    type: 'decision',
    label: 'Decision',
    icon: <Diamond className="w-5 h-5" />,
    color: 'bg-orange-100 border-orange-300 text-orange-800',
    description: 'Conditional branching'
  },
  {
    type: 'input',
    label: 'Input',
    icon: <ArrowRight className="w-5 h-5 rotate-180" />,
    color: 'bg-purple-100 border-purple-300 text-purple-800',
    description: 'Data input operation'
  },
  {
    type: 'output',
    label: 'Output',
    icon: <ArrowRight className="w-5 h-5" />,
    color: 'bg-indigo-100 border-indigo-300 text-indigo-800',
    description: 'Data output operation'
  },
  {
    type: 'loop',
    label: 'Loop',
    icon: <div className="w-5 h-5 border-2 border-current rounded-full" />,
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
  // const [dragOffset, setDragOffset] = useState<{ x: number; y: number } | null>(null); // Removed dragOffset state
  const initialNodePositionRef = useRef<{ x: number; y: number } | null>(null);
  const initialMouseWorldPositionRef = useRef<{ x: number; y: number } | null>(null);
  const didDragNodeRef = useRef(false);
  const [otherUsersOnFlowchart, setOtherUsersOnFlowchart] = useState<UserPresence[]>([]);
  const [isLoading, setIsLoading] = useState(false); // For loading indicator
  const [zoomLevel, setZoomLevel] = useState(1);
  const ZOOM_STEP = 0.1;
  const MIN_ZOOM = 0.5;
  const MAX_ZOOM = 2;
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [pendingEdgeInfo, setPendingEdgeInfo] = useState<{ source: string, target: string } | null>(null);
  const [showConditionChoiceModal, setShowConditionChoiceModal] = useState(false);


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
      // setDragOffset(null); // dragOffset state removed
      initialNodePositionRef.current = null;
      initialMouseWorldPositionRef.current = null;
    }
  }, [draggingNodeId, setFlowchartData, setDraggingNodeId]); // Removed setDragOffset from deps

  useEffect(() => {
    // This effect handles the case where the mouse is released outside the canvas or window
    if (draggingNodeId) {
      window.addEventListener('mouseup', handleDragEnd);
    }
    return () => {
      window.removeEventListener('mouseup', handleDragEnd);
    };
  }, [draggingNodeId, handleDragEnd]);

  // Effect to load flowchart from Firebase or newFlowchartToLoad prop
  useEffect(() => {
    // If newFlowchartToLoad is provided (e.g., by AI generation), prioritize it
    if (newFlowchartToLoad && (newFlowchartToLoad.nodes.length > 0 || newFlowchartToLoad.edges.length > 0)) {
      console.log('FlowchartBuilder: Loading flowchart from newFlowchartToLoad prop:', newFlowchartToLoad);
      setFlowchartData(newFlowchartToLoad);
      setSelectedNodeForProperties(null);
      return; // Prioritize prop over Firebase load for this render cycle
    }

    // Otherwise, try to load from Firebase if user and exercise are available
    if (currentUser && exercise && exercise.id) {
      setIsLoading(true);
      const db = getDatabase(app);
      const flowchartPath = `userFlowcharts/${currentUser.uid}/${exercise.id}`;
      const flowchartRef = ref(db, flowchartPath);

      get(flowchartRef).then((snapshot) => {
        if (snapshot.exists()) {
          const loadedData = snapshot.val() as FlowchartData;
          // Ensure loaded data has nodes and edges arrays even if empty
          loadedData.nodes = loadedData.nodes || [];
          loadedData.edges = loadedData.edges || [];
          setFlowchartData(loadedData);
          console.log(`Flowchart loaded for exercise ${exercise.id}`, loadedData);
        } else {
          // No saved flowchart found, reset to blank
          setFlowchartData({ nodes: [], edges: [] });
          console.log(`No saved flowchart found for exercise ${exercise.id}, starting fresh.`);
        }
      }).catch((error) => {
        console.error("Error loading flowchart from Firebase:", error);
        setFlowchartData({ nodes: [], edges: [] }); // Reset on error
      }).finally(() => {
        setIsLoading(false);
      });
    } else {
      // No user or exercise, reset to blank (e.g., if user logs out or no exercise selected)
      setFlowchartData({ nodes: [], edges: [] });
      setSelectedNodeForProperties(null); // Clear selection
    }
  }, [currentUser, exercise, newFlowchartToLoad]); // Rerun if user, exercise, or externally loaded flowchart changes


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

  // Effect to handle Escape key for exiting connect mode
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && isConnecting) {
        setIsConnecting(false);
        setConnectionStart(null);
        setConnectingMousePosition(null);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isConnecting]); // Re-run if isConnecting changes, though the core logic only depends on its value


  const handleDragStart = (nodeType: FlowchartNodeType) => {
    setDraggedNodeType(nodeType);
    if (window.innerWidth < 768) { // md breakpoint, consistent with panel logic
      setIsPaletteOpen(false);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (!draggedNodeType || !canvasRef.current) return;

    const rect = canvasRef.current.getBoundingClientRect();
    // Adjust mouse coordinates for zoom
    const x = (e.clientX - rect.left) / zoomLevel;
    const y = (e.clientY - rect.top) / zoomLevel;

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

  const handleZoomIn = () => {
    setZoomLevel(prevZoom => Math.min(MAX_ZOOM, prevZoom + ZOOM_STEP));
  };

  const handleZoomOut = () => {
    setZoomLevel(prevZoom => Math.max(MIN_ZOOM, prevZoom - ZOOM_STEP));
  };

  const handleResetZoom = () => {
    setZoomLevel(1);
  };

  const handleWheelZoom = (e: React.WheelEvent) => {
    if (e.ctrlKey) { // Require Ctrl key for wheel zoom to prevent accidental zoom while scrolling
      e.preventDefault();
      if (e.deltaY < 0) {
        handleZoomIn();
      } else if (e.deltaY > 0) {
        handleZoomOut();
      }
    }
    // If Ctrl key is not pressed, let the default scroll behavior happen (for panning when zoomed in)
  };

  const handleCanvasMouseMove = (e: React.MouseEvent) => {
    if (!canvasRef.current) return;
    const rect = canvasRef.current.getBoundingClientRect();
    // Adjust mouse coordinates for zoom
    const currentMouseXInViewport = e.clientX - rect.left;
    const currentMouseYInViewport = e.clientY - rect.top;

    const currentMouseXInWorld = currentMouseXInViewport / zoomLevel;
    const currentMouseYInWorld = currentMouseYInViewport / zoomLevel;

    if (draggingNodeId && initialNodePositionRef.current && initialMouseWorldPositionRef.current) {
      const deltaMouseWorldX = currentMouseXInWorld - initialMouseWorldPositionRef.current.x;
      const deltaMouseWorldY = currentMouseYInWorld - initialMouseWorldPositionRef.current.y;

      const newNodeX = initialNodePositionRef.current.x + deltaMouseWorldX;
      const newNodeY = initialNodePositionRef.current.y + deltaMouseWorldY;

      setFlowchartData(prev => ({
        ...prev,
        nodes: prev.nodes.map(n =>
          n.id === draggingNodeId
            ? { ...n, position: { x: newNodeX, y: newNodeY } }
            : n
        )
      }));
      didDragNodeRef.current = true;
    } else if (isConnecting && connectionStart) {
      setConnectingMousePosition({
        x: currentMouseXInWorld, // Use scaled coordinates for line preview too
        y: currentMouseYInWorld,
      });
    } else if (connectingMousePosition) {
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
    const mouseXInViewport = event.clientX - canvasRect.left;
    const mouseYInViewport = event.clientY - canvasRect.top;

    const mouseXInWorld = mouseXInViewport / zoomLevel;
    const mouseYInWorld = mouseYInViewport / zoomLevel;

    initialNodePositionRef.current = { x: node.position.x, y: node.position.y };
    initialMouseWorldPositionRef.current = { x: mouseXInWorld, y: mouseYInWorld };

    setDraggingNodeId(nodeId);
    // setDragOffset is removed

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
        // This is the first click in a connection sequence: SET SOURCE NODE
        setConnectionStart(nodeId);
        // Visual feedback for line preview is handled by onMouseMove (connectingMousePosition)
      } else {
        // This is the second click: SET TARGET NODE & CREATE EDGE
        if (connectionStart !== nodeId) { // Prevent connecting a node to itself
          const sourceNode = flowchartData.nodes.find(n => n.id === connectionStart);
          if (sourceNode && sourceNode.type === 'decision') {
            // If source is a decision node, show modal to choose condition type
            setPendingEdgeInfo({ source: connectionStart, target: nodeId });
            setShowConditionChoiceModal(true);
            // Don't reset connectionStart yet, modal will handle edge creation or cancellation
          } else {
            // Regular edge creation
            const newEdge: FlowchartEdge = {
              id: `edge-${Date.now()}`,
              source: connectionStart,
              target: nodeId,
              type: 'default',
              conditionType: null, // Default for non-decision edges
            };
            setFlowchartData(prev => ({
              ...prev,
              edges: [...prev.edges, newEdge],
            }));
            // Reset for the next connection, but STAY in connecting mode
            setConnectionStart(null);
            setConnectingMousePosition(null);
          }
        } else { // Clicked on the source node itself
           // Reset for the next connection, but STAY in connecting mode
           setConnectionStart(null);
           setConnectingMousePosition(null);
        }
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

const handleSaveFlowchart = async () => {
  if (!currentUser) {
    alert("You must be logged in to save your flowchart.");
    return;
  }
  if (!exercise || !exercise.id) {
    console.error("Exercise context is missing, cannot save.");
    alert("Cannot save flowchart: exercise data is missing.");
    return;
  }

  setIsSaving(true);
  const db = getDatabase(app);
  const flowchartPath = `userFlowcharts/${currentUser.uid}/${exercise.id}`;

  // Sanitize flowchartData before saving
  const sanitizedFlowchartData = JSON.parse(JSON.stringify(flowchartData)); // Deep copy

  sanitizedFlowchartData.nodes = sanitizedFlowchartData.nodes.map((node: FlowchartNode) => ({
    ...node,
    data: {
      label: node.data.label, // Assuming label is always defined
      value: node.data.value === undefined ? null : node.data.value,
      condition: node.data.condition === undefined ? null : node.data.condition,
    },
  }));

  sanitizedFlowchartData.edges = sanitizedFlowchartData.edges.map((edge: FlowchartEdge) => ({
    ...edge,
    label: edge.label === undefined ? null : edge.label,
  }));

  try {
    await set(ref(db, flowchartPath), sanitizedFlowchartData);
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 2000); // Display success for 2 seconds
  } catch (error) {
    console.error("Error saving flowchart:", error);
    // Check if the error is the specific "undefined" error to give a more targeted message
    if (error instanceof Error && error.message.includes("undefined")) {
        alert("Failed to save flowchart due to unexpected data. Please try modifying the problematic element or report this issue.");
    } else {
        alert("Failed to save flowchart. See console for details.");
    }
  } finally {
    setIsSaving(false);
  }
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

const handleConditionTypeSelect = (conditionType: 'true' | 'false') => {
  if (!pendingEdgeInfo || !connectionStart) {
    // Should not happen if modal is shown correctly
    console.error("Pending edge info or connection start is missing.");
    setShowConditionChoiceModal(false);
    setPendingEdgeInfo(null);
    setConnectionStart(null); // Reset connection mode
    setConnectingMousePosition(null);
    return;
  }

  const { source, target } = pendingEdgeInfo;

  // Check if an edge with this conditionType already exists from this source node
  const existingEdgeOfSameConditionType = flowchartData.edges.find(
    edge => edge.source === source && edge.conditionType === conditionType
  );

  if (existingEdgeOfSameConditionType) {
    alert(`A '${conditionType}' path already exists for this decision node. Please delete it first or choose a different type.`);
    // Do not close modal, let user decide or cancel
    return;
  }

  const newEdge: FlowchartEdge = {
    id: `edge-${Date.now()}`,
    source: source,
    target: target,
    type: 'default', // Or a specific type for decision branches if needed for styling
    conditionType: conditionType,
  };

  setFlowchartData(prev => ({
    ...prev,
    edges: [...prev.edges, newEdge],
  }));

  setShowConditionChoiceModal(false);
  setPendingEdgeInfo(null);
  // Reset for the next connection, but STAY in connecting mode (as per original logic)
  setConnectionStart(null);
  setConnectingMousePosition(null);
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

  // --- DEBUGGING LOGS START ---
  if (flowchartData.nodes && flowchartData.nodes.length > 0) {
    console.log('[DEBUG FlowchartBuilder RENDER] First node structure from state:', JSON.stringify(flowchartData.nodes[0], null, 2));
    const firstNode = flowchartData.nodes[0];
    console.log('[DEBUG FlowchartBuilder RENDER] node.id:', firstNode.id);
    console.log('[DEBUG FlowchartBuilder RENDER] typeof node.position:', typeof firstNode.position);
    console.log('[DEBUG FlowchartBuilder RENDER] node.position content:', JSON.stringify(firstNode.position, null, 2));
    console.log('[DEBUG FlowchartBuilder RENDER] Does first node have position.x?', firstNode.position?.hasOwnProperty('x'));
    console.log('[DEBUG FlowchartBuilder RENDER] typeof node.data:', typeof firstNode.data);
    console.log('[DEBUG FlowchartBuilder RENDER] node.data content:', JSON.stringify(firstNode.data, null, 2));
    console.log('[DEBUG FlowchartBuilder RENDER] Does first node have data.label?', firstNode.data?.hasOwnProperty('label'));
  } else {
    console.log('[DEBUG FlowchartBuilder RENDER] No nodes in flowchartData state to log.');
  }
  // --- DEBUGGING LOGS END ---

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
        
        <div className="flex items-center flex-wrap justify-end space-x-1 sm:space-x-2 ml-2">
          {/* Zoom Controls */}
          <div className="flex items-center border border-gray-200 rounded-md" data-tour-id="zoom-controls-container">
            <button
              onClick={handleZoomOut}
              className="p-1.5 text-gray-600 hover:bg-gray-100 disabled:opacity-50"
              title="Zoom Out"
              disabled={zoomLevel <= MIN_ZOOM}
            >
              <ZoomOut size={18} />
            </button>
            <button
              onClick={handleResetZoom}
              className="p-1.5 text-gray-600 hover:bg-gray-100 border-l border-r border-gray-200"
              title="Reset Zoom"
            >
              <RefreshCcw size={16} />
            </button>
            <button
              onClick={handleZoomIn}
              className="p-1.5 text-gray-600 hover:bg-gray-100 disabled:opacity-50"
              title="Zoom In"
              disabled={zoomLevel >= MAX_ZOOM}
            >
              <ZoomIn size={18} />
            </button>
          </div>

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
            data-tour-id="connect-nodes-button"
          >
            {isConnecting ? 'Connecting...' : 'Connect Nodes'}
          </button>

          <button
            onClick={handleSaveFlowchart}
            disabled={isSaving || !currentUser}
            className="flex items-center px-2 sm:px-3 py-1 sm:py-1.5 text-xs sm:text-sm text-white bg-green-600 rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            title={!currentUser ? "Log in to save" : "Save Flowchart"}
            data-tour-id="save-flowchart-button"
          >
            <Save className="w-3 h-3 sm:w-4 sm:h-4 mr-1" />
            {isSaving ? 'Saving...' : (saveSuccess ? 'Saved!' : 'Save')}
          </button>
          
          <button
            onClick={generateCodeFromFlowchart}
            disabled={flowchartData.nodes.length === 0 || isSaving}
            className="flex items-center px-2 sm:px-3 py-1 sm:py-1.5 text-xs sm:text-sm text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            data-tour-id="generate-code-button"
          >
            <Zap className="w-3 h-3 sm:w-4 sm:h-4 mr-1" />
            Generate Code
          </button>
          
          <button
            onClick={() => onRunCode(generatedCode)}
            disabled={!generatedCode || isRunning}
            className="flex items-center px-2 sm:px-3 py-1 sm:py-1.5 text-xs sm:text-sm text-white bg-emerald-600 rounded-md hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            data-tour-id="run-code-button"
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
            title="This feature is coming soon!"
          >
            <Upload className="w-3 h-3 sm:w-4 sm:h-4 mr-1" />
            Import (WIP)
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
                  <div title={node.description} className="flex items-center">
                    {node.icon}
                    <span className="ml-2 font-medium text-sm">{node.label}</span>
                  </div>
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

        {/* Canvas Container */}
        <div
            ref={canvasRef}
            className="flex-1 relative overflow-auto bg-gray-50 flowchart-dots-bg" // Added overflow-auto
            onDragOver={handleDragOver}
            onDrop={handleDrop}
            onMouseMove={handleCanvasMouseMove}
            onMouseUp={handleDragEnd}
            onClick={handleCanvasClick}
            onWheel={handleWheelZoom}
        >
            {/* Inner Scalable Canvas Content */}
            <div
                className="relative w-full h-full" // w-full h-full to match parent before scaling
                style={{
                    transform: `scale(${zoomLevel})`,
                    transformOrigin: 'top left',
                    // The effective size of this div will be scaled.
                    // Parent has overflow:auto to handle it.
                }}
            >
                {isLoading && !isGeneratingFlowchart && ( // Show only if not already showing AI generation spinner
                  <div className="absolute inset-0 bg-gray-200 bg-opacity-50 flex items-center justify-center z-40" style={{transform: `scale(${1/zoomLevel})`, transformOrigin: 'center center' }}>
                    <p className="text-gray-700 font-semibold">Loading Flowchart...</p>
                  </div>
                )}
                {isGeneratingFlowchart && (
                  <div className="absolute inset-0 bg-gray-500 bg-opacity-50 flex items-center justify-center z-50" style={{transform: `scale(${1/zoomLevel})`, transformOrigin: 'center center' }}>
                    {/* Spinner itself should not scale, or scale inversely */}
                    <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-blue-500"></div>
                    <p className="ml-3 text-white font-semibold">Generating Flowchart...</p>
                  </div>
                )}
                {/* Render Edges */}
                {/* SVG needs to be positioned absolutely to fill its scaled container, or its dimensions adjusted */}
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
                    {sourceNode.type === 'decision' && edge.conditionType && (
                      <text
                        x={(x1 + x2) / 2} // Position in the middle of the edge
                        y={(y1 + y2) / 2 - 15} // Increased offset to move label further above
                        textAnchor="middle"
                        fill="#333" // Color for the label
                        fontSize="10px"
                        fontWeight="bold"
                        className="pointer-events-none select-none" // Ensure text doesn't interfere with clicks and is not selectable
                      >
                        {edge.conditionType === 'true' ? 'True' : 'False'}
                      </text>
                    )}
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
                }`} title={node.data.label} // Show full label on hover
                >
                  <span className="text-xs font-medium text-center leading-tight block truncate overflow-hidden text-ellipsis">
                    {node.data.label}
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

      <ConditionChoiceModal
        isOpen={showConditionChoiceModal}
        onClose={() => {
          setShowConditionChoiceModal(false);
          setPendingEdgeInfo(null);
          // Reset connection mode if user cancels
          setConnectionStart(null);
          setConnectingMousePosition(null);
        }}
        onSelectConditionType={handleConditionTypeSelect}
        sourceNodeId={pendingEdgeInfo?.source || null}
      />
    </div>
  );
};