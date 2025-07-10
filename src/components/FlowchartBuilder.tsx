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
  isGeneratingFlowchart,
  highlightedNodeId
}) => {
  const { currentUser } = useAuth();
  const [flowchartData, setFlowchartData] = useState<FlowchartData>({
    nodes: [],
    edges: []
  });
  const [selectedNodeForProperties, setSelectedNodeForProperties] = useState<string | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [connectionStart, setConnectionStart] = useState<string | null>(null);
  const [draggedNodeType, setDraggedNodeType] = useState<FlowchartNodeType | null>(null);
  const [generatedCode, setGeneratedCode] = useState<string>('');
  const canvasRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [connectingMousePosition, setConnectingMousePosition] = useState<{ x: number; y: number } | null>(null);
  const [isPaletteOpen, setIsPaletteOpen] = useState(true);
  const [isPropertiesOpen, setIsPropertiesOpen] = useState(true);
  const [draggingNodeId, setDraggingNodeId] = useState<string | null>(null);
  const [dragOffset, setDragOffset] = useState<{ x: number; y: number } | null>(null);
  const didDragNodeRef = useRef(false);
  const [otherUsersOnFlowchart, setOtherUsersOnFlowchart] = useState<UserPresence[]>([]);
  const [zoomLevel, setZoomLevel] = useState(1);
  const ZOOM_STEP = 0.1;
  const MIN_ZOOM = 0.25; // Adjusted MIN_ZOOM
  const MAX_ZOOM = 2;


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
            user !== null && typeof user === 'object' && 'uid' in user &&
            'status' in user && 'currentFlowchartId' in user &&
            (user as UserPresence).uid !== currentUser.uid &&
            (user as UserPresence).status === 'online' &&
            (user as UserPresence).currentFlowchartId === currentFlowchartIdForPresence
          )
          .map(user => user as UserPresence);
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
  }, [draggingNodeId]); // Removed redundant dependencies

  useEffect(() => {
    if (draggingNodeId) {
      window.addEventListener('mouseup', handleDragEnd);
    }
    return () => {
      window.removeEventListener('mouseup', handleDragEnd);
    };
  }, [draggingNodeId, handleDragEnd]);

  useEffect(() => {
    if (newFlowchartToLoad && (newFlowchartToLoad.nodes.length > 0 || newFlowchartToLoad.edges.length > 0)) {
      console.log('[FlowchartBuilder LoadEffect] Received new flowchart. Nodes:', newFlowchartToLoad.nodes.length, 'Edges:', newFlowchartToLoad.edges.length);
      setFlowchartData(newFlowchartToLoad);
      setSelectedNodeForProperties(null);
    }
  }, [newFlowchartToLoad]);

  useEffect(() => {
    if (!canvasRef.current) return;
    if (flowchartData.nodes.length > 0) {
      console.log('[FlowchartBuilder ZoomEffect] Nodes count:', flowchartData.nodes.length);
      const nodes = flowchartData.nodes;
      let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
      nodes.forEach(node => {
        const nodeWidth = 128; const nodeHeight = 64;
        minX = Math.min(minX, node.position.x);
        minY = Math.min(minY, node.position.y);
        maxX = Math.max(maxX, node.position.x + nodeWidth);
        maxY = Math.max(maxY, node.position.y + nodeHeight);
      });

      const flowchartWidth = maxX - minX;
      const flowchartHeight = maxY - minY;

      if (flowchartWidth > 0 && flowchartHeight > 0) {
        const canvas = canvasRef.current;
        const canvasWidth = canvas.clientWidth;
        const canvasHeight = canvas.clientHeight;
        const PADDING = 100;

        let targetZoom = 1;
        if (canvasWidth > 2 * PADDING && canvasHeight > 2 * PADDING) {
            const zoomX = (canvasWidth - 2 * PADDING) / flowchartWidth;
            const zoomY = (canvasHeight - 2 * PADDING) / flowchartHeight;
            targetZoom = Math.min(zoomX, zoomY);
        }
        targetZoom = Math.max(MIN_ZOOM, Math.min(targetZoom, MAX_ZOOM));
        console.log(`[FlowchartBuilder ZoomEffect] Canvas WxH: ${canvasWidth}x${canvasHeight}, Flowchart WxH: ${flowchartWidth}x${flowchartHeight}, TargetZoom: ${targetZoom}`);
        if (Math.abs(zoomLevel - targetZoom) > 0.01) {
            setZoomLevel(targetZoom);
        }
      } else {
        console.log("[FlowchartBuilder ZoomEffect] Zero/Negative flowchart dimensions. Setting zoom to 1.");
        if (zoomLevel !== 1) setZoomLevel(1);
      }
    } else if (flowchartData.nodes.length === 0 && zoomLevel !== 1) {
        console.log("[FlowchartBuilder ZoomEffect] No nodes. Resetting zoom to 1.");
        setZoomLevel(1);
    }
  }, [flowchartData, MIN_ZOOM, MAX_ZOOM]); // Removed canvasRef.current from deps

  useEffect(() => {
    if (!canvasRef.current) {
        console.log("[FlowchartBuilder ScrollEffect] canvasRef missing. Skipping scroll.");
        return;
    }
    if (flowchartData.nodes.length > 0 && zoomLevel > 0) {
      console.log(`[FlowchartBuilder ScrollEffect] Zoom: ${zoomLevel}, Nodes: ${flowchartData.nodes.length}`);
      const nodes = flowchartData.nodes;
      let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
      nodes.forEach(node => {
        const nodeWidth = 128; const nodeHeight = 64;
        minX = Math.min(minX, node.position.x);
        minY = Math.min(minY, node.position.y);
        maxX = Math.max(maxX, node.position.x + nodeWidth);
        maxY = Math.max(maxY, node.position.y + nodeHeight);
      });

      const flowchartWidth = maxX - minX;
      const flowchartHeight = maxY - minY;

      if (flowchartWidth > 0 && flowchartHeight > 0) {
        const canvas = canvasRef.current;
        const canvasWidth = canvas.clientWidth;
        const canvasHeight = canvas.clientHeight;

        const contentScaledWidth = flowchartWidth * zoomLevel;
        const contentScaledHeight = flowchartHeight * zoomLevel;
        const contentScaledMinX = minX * zoomLevel;
        const contentScaledMinY = minY * zoomLevel;

        let newScrollLeft = contentScaledMinX + (contentScaledWidth / 2) - (canvasWidth / 2);
        let newScrollTop = contentScaledMinY + (contentScaledHeight / 2) - (canvasHeight / 2);

        newScrollLeft = Math.max(0, newScrollLeft);
        newScrollTop = Math.max(0, newScrollTop);

        console.log(`[FlowchartBuilder ScrollEffect] Target Scroll: SL:${newScrollLeft}, ST:${newScrollTop}`);

        setTimeout(() => {
            if (canvasRef.current) {
                canvasRef.current.scrollLeft = newScrollLeft;
                canvasRef.current.scrollTop = newScrollTop;
                console.log(`[FlowchartBuilder ScrollEffect Timeout] Applied: SL:${canvasRef.current.scrollLeft}, ST:${canvasRef.current.scrollTop}`);
            }
        }, 0);
      } else {
        console.log("[FlowchartBuilder ScrollEffect] Zero/Negative flowchart dimensions. Skipping scroll.");
      }
    } else {
      if (canvasRef.current) {
        canvasRef.current.scrollLeft = 0;
        canvasRef.current.scrollTop = 0;
      }
    }
  }, [flowchartData, zoomLevel]);

  useEffect(() => {
    const handleResize = () => {
      setIsPaletteOpen(window.innerWidth >= 768);
      setIsPropertiesOpen(window.innerWidth >= 768);
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const debounce = <F extends (...args: any[]) => any>(func: F, waitFor: number) => {
    let timeout: ReturnType<typeof setTimeout> | null = null;
    const debounced = (...args: Parameters<F>) => {
      if (timeout !== null) clearTimeout(timeout);
      timeout = setTimeout(() => func(...args), waitFor);
    };
    return debounced as (...args: Parameters<F>) => ReturnType<F>;
  };

  useEffect(() => {
    const handleResizeInternal = () => {
      setIsPaletteOpen(window.innerWidth >= 768 || window.innerWidth < 768); // Keep palette open logic
      setIsPropertiesOpen(window.innerWidth >= 768);
    };
    const debouncedResize = debounce(handleResizeInternal, 200);
    debouncedResize();
    window.addEventListener('resize', debouncedResize);
    return () => window.removeEventListener('resize', debouncedResize);
  }, []);

  useEffect(() => {
    if (selectedNodeForProperties) setIsPropertiesOpen(true);
  }, [selectedNodeForProperties]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && isConnecting) {
        setIsConnecting(false);
        setConnectionStart(null);
        setConnectingMousePosition(null);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isConnecting]);

  const handleDragStart = (nodeType: FlowchartNodeType) => {
    setDraggedNodeType(nodeType);
    if (window.innerWidth < 768) setIsPaletteOpen(false);
  };

  const handleDragOver = (e: React.DragEvent) => e.preventDefault();

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (!draggedNodeType || !canvasRef.current) return;
    const rect = canvasRef.current.getBoundingClientRect();
    const x = (e.clientX - rect.left) / zoomLevel;
    const y = (e.clientY - rect.top) / zoomLevel;
    const newNode: FlowchartNode = {
      id: `node-${Date.now()}`, type: draggedNodeType,
      position: { x: x - 64, y: y - 32 },
      data: { label: draggedNodeType.charAt(0).toUpperCase() + draggedNodeType.slice(1), value: '' }
    };
    setFlowchartData(prev => ({ ...prev, nodes: [...prev.nodes, newNode] }));
    setDraggedNodeType(null);
  };

  const handleZoomIn = () => setZoomLevel(prev => Math.min(MAX_ZOOM, prev + ZOOM_STEP));
  const handleZoomOut = () => setZoomLevel(prev => Math.max(MIN_ZOOM, prev - ZOOM_STEP));
  const handleResetZoom = () => setZoomLevel(1);

  const handleWheelZoom = (e: React.WheelEvent) => {
    if (e.ctrlKey) {
      e.preventDefault();
      if (e.deltaY < 0) handleZoomIn(); else handleZoomOut();
    }
  };

  const handleCanvasMouseMove = (e: React.MouseEvent) => {
    if (!canvasRef.current) return;
    const rect = canvasRef.current.getBoundingClientRect();
    const mouseXInCanvas = (e.clientX - rect.left) / zoomLevel;
    const mouseYInCanvas = (e.clientY - rect.top) / zoomLevel;

    if (draggingNodeId && dragOffset) {
      const newNodeX = mouseXInCanvas - dragOffset.x;
      const newNodeY = mouseYInCanvas - dragOffset.y;
      setFlowchartData(prev => ({
        ...prev,
        nodes: prev.nodes.map(n =>
          n.id === draggingNodeId ? { ...n, position: { x: newNodeX, y: newNodeY } } : n
        )
      }));
      didDragNodeRef.current = true;
    } else if (isConnecting && connectionStart) {
      setConnectingMousePosition({ x: mouseXInCanvas, y: mouseYInCanvas });
    } else if (connectingMousePosition) {
      setConnectingMousePosition(null);
    }
  };

  const handleNodeMouseDown = (event: React.MouseEvent, nodeId: string) => {
    event.preventDefault(); event.stopPropagation();
    didDragNodeRef.current = false;
    const node = flowchartData.nodes.find(n => n.id === nodeId);
    if (!node || !canvasRef.current) return;
    const canvasRect = canvasRef.current.getBoundingClientRect();
    const mouseXInCanvas = event.clientX - canvasRect.left; // Not dividing by zoom here for offset calc
    const mouseYInCanvas = event.clientY - canvasRect.top;  // Relative to unscaled canvas viewport
    // Offset should be calculated from the node's current screen position to mouse
    // Node's screen pos: node.position.x * zoomLevel, node.position.y * zoomLevel
    // This is complex because of scrolling. Simpler: offset within the node itself.
    const offsetX = (event.clientX - canvasRect.left) / zoomLevel - node.position.x;
    const offsetY = (event.clientY - canvasRect.top) / zoomLevel - node.position.y;

    setDraggingNodeId(nodeId);
    setDragOffset({ x: offsetX, y: offsetY });
    setFlowchartData(prev => ({ ...prev, nodes: prev.nodes.map(n => n.id === nodeId ? { ...n, isDragging: true } : n) }));
  };

  const handleNodeClick = (nodeId: string) => {
    if (didDragNodeRef.current) return;
    if (isConnecting) {
      if (!connectionStart) setConnectionStart(nodeId);
      else {
        if (connectionStart !== nodeId) {
          const newEdge: FlowchartEdge = { id: `edge-${Date.now()}`, source: connectionStart, target: nodeId, type: 'default' };
          setFlowchartData(prev => ({ ...prev, edges: [...prev.edges, newEdge] }));
        }
        setConnectionStart(null); setConnectingMousePosition(null);
      }
    } else setSelectedNodeForProperties(nodeId);

    if (currentUser) {
      const db = getDatabase(app);
      const userPresenceRef = ref(db, `onlineUsers/${currentUser.uid}`);
      update(userPresenceRef, { currentNodeId: nodeId, lastSeen: serverTimestamp() })
        .catch(err => console.error("Error updating presence:", err));
    }
  };

  const handleCanvasClick = (event: React.MouseEvent) => {
    if (event.target === event.currentTarget) {
      setSelectedNodeForProperties(null);
      if (currentUser) {
        const db = getDatabase(app);
        const userPresenceRef = ref(db, `onlineUsers/${currentUser.uid}`);
        update(userPresenceRef, { currentNodeId: null, lastSeen: serverTimestamp() })
          .catch(err => console.error("Error clearing presence:", err));
      }
    }
  };

  const handleNodeUpdate = (nodeId: string, updates: Partial<FlowchartNode['data']>) => {
    setFlowchartData(prev => ({
      ...prev,
      nodes: prev.nodes.map(node => node.id === nodeId ? { ...node, data: { ...node.data, ...updates } } : node)
    }));
  };

  const handleDeleteNode = (nodeId: string) => {
    setFlowchartData(prev => ({
      nodes: prev.nodes.filter(node => node.id !== nodeId),
      edges: prev.edges.filter(edge => edge.source !== nodeId && edge.target !== nodeId)
    }));
    if (selectedNodeForProperties === nodeId) setSelectedNodeForProperties(null);
    // Firebase presence update for deleted node implicitly handled by selection clearing
  };

  const handleImageFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const formData = new FormData(); formData.append('file', file);
    const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';
    try {
      const response = await fetch(`${apiBaseUrl}/api/import-image`, { method: 'POST', body: formData });
      if (!response.ok) {
        const errData = await response.json().catch(() => ({ detail: response.statusText }));
        alert(`Failed to import: ${errData.detail}`); return;
      }
      const apiResponse = await response.json();
      if (apiResponse.fallback_used && apiResponse.error) alert(`Import Alert: ${apiResponse.error}`);
      const feNodes: FlowchartNode[] = apiResponse.nodes.map((apiNode: any) => ({
        id: apiNode.id, type: apiNode.type, position: { x: apiNode.x, y: apiNode.y },
        data: { label: apiNode.label },
      }));
      const feEdges: FlowchartEdge[] = apiResponse.edges.map((apiEdge: any) => ({
        id: apiEdge.id, source: apiEdge.source, target: apiEdge.target,
        label: apiEdge.label, type: 'default',
      }));
      updateFlowchartDataWithMLOutput({ nodes: feNodes, edges: feEdges });
    } catch (error) {
      alert(`Error: ${error instanceof Error ? error.message : String(error)}`);
    } finally {
      if (event.target) event.target.value = '';
    }
  };

  const updateFlowchartDataWithMLOutput = (data: FlowchartData) => {
    setFlowchartData(data); setSelectedNodeForProperties(null);
    onGenerateCode(data);
  };

  const triggerImageUpload = () => fileInputRef.current?.click();
  const handleDeleteEdge = (edgeId: string) => setFlowchartData(prev => ({ ...prev, edges: prev.edges.filter(e => e.id !== edgeId) }));

  const generateCodeFromFlowchart = () => {
    const code = convertFlowchartToCode(flowchartData);
    setGeneratedCode(code); onGenerateCode(flowchartData);
  };

  const convertFlowchartToCode = (data: FlowchartData): string => {
    let codeLines = ['function solution('];
    const inputNodes = data.nodes.filter(n => n.type === 'input');
    codeLines.push(inputNodes.map((_, i) => `input${i+1}`).join(', ') + ') {');
    inputNodes.forEach((n, i) => codeLines.push(`  let ${n.data.label.toLowerCase().replace(/\s+/g, '') || `var${i+1}`} = input${i+1};`));
    // This is a placeholder; proper sequential execution based on edges is needed.
    data.nodes.filter(n => n.type === 'process' && n.data.value).forEach(n => codeLines.push(`  ${n.data.value};`));
    const outputNode = data.nodes.find(n => n.type === 'output');
    if (outputNode) codeLines.push(`  return ${outputNode.data.value || outputNode.data.label};`);
    else codeLines.push('  // No output node defined');
    codeLines.push('}');
    return codeLines.join('\n');
  };
  
  const clearCanvas = () => {
    setFlowchartData({ nodes: [], edges: [] }); setSelectedNodeForProperties(null);
    setGeneratedCode(''); setConnectingMousePosition(null);
    if (currentUser) {
      const db = getDatabase(app);
      const userPresenceRef = ref(db, `onlineUsers/${currentUser.uid}`);
      update(userPresenceRef, { currentNodeId: null, lastSeen: serverTimestamp() });
    }
  };

  const getNodeStyle = (type: FlowchartNodeType) => nodePalette.find(p => p.type === type)?.color || 'bg-gray-100';
  const selectedNodeData = selectedNodeForProperties ? flowchartData.nodes.find(n => n.id === selectedNodeForProperties) : null;

  // --- DEBUGGING LOGS START ---
  if (flowchartData.nodes && flowchartData.nodes.length > 0) {
    // console.log('[DEBUG FlowchartBuilder RENDER] First node structure from state:', JSON.stringify(flowchartData.nodes[0], null, 2));
    // const firstNode = flowchartData.nodes[0];
    // console.log('[DEBUG FlowchartBuilder RENDER] node.id:', firstNode.id);
    // console.log('[DEBUG FlowchartBuilder RENDER] typeof node.position:', typeof firstNode.position);
    // console.log('[DEBUG FlowchartBuilder RENDER] node.position content:', JSON.stringify(firstNode.position, null, 2));
    // console.log('[DEBUG FlowchartBuilder RENDER] Does first node have position.x?', firstNode.position?.hasOwnProperty('x'));
    // console.log('[DEBUG FlowchartBuilder RENDER] typeof node.data:', typeof firstNode.data);
    // console.log('[DEBUG FlowchartBuilder RENDER] node.data content:', JSON.stringify(firstNode.data, null, 2));
    // console.log('[DEBUG FlowchartBuilder RENDER] Does first node have data.label?', firstNode.data?.hasOwnProperty('label'));
  } else {
    // console.log('[DEBUG FlowchartBuilder RENDER] No nodes in flowchartData state to log.');
  }
  // --- DEBUGGING LOGS END ---

  return (
    <div className="bg-white rounded-lg border border-gray-200 h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-2 sm:p-4 border-b border-gray-200">
        <div className="flex items-center flex-shrink-0">
          <button
            onClick={() => setIsPaletteOpen(!isPaletteOpen)}
            className="p-1.5 hover:bg-gray-200 rounded-md mr-1 sm:mr-2 md:hidden"
            title={isPaletteOpen ? "Hide Palette" : "Show Palette"}
          >
            <Palette size={20} />
          </button>
          <Zap className="w-5 h-5 text-blue-600 mr-1 sm:mr-2" />
          <h3 className="text-base sm:text-lg font-semibold text-gray-900 truncate">Interactive Flowchart Builder</h3>
        </div>
        
        <div className="flex items-center flex-wrap justify-end space-x-1 sm:space-x-2 ml-2">
          <div className="flex items-center border border-gray-200 rounded-md" data-tour-id="zoom-controls-container">
            <button onClick={handleZoomOut} className="p-1.5 text-gray-600 hover:bg-gray-100 disabled:opacity-50" title="Zoom Out" disabled={zoomLevel <= MIN_ZOOM}><ZoomOut size={18} /></button>
            <button onClick={handleResetZoom} className="p-1.5 text-gray-600 hover:bg-gray-100 border-l border-r border-gray-200" title="Reset Zoom"><RefreshCcw size={16} /></button>
            <button onClick={handleZoomIn} className="p-1.5 text-gray-600 hover:bg-gray-100 disabled:opacity-50" title="Zoom In" disabled={zoomLevel >= MAX_ZOOM}><ZoomIn size={18} /></button>
          </div>
          <button
            onClick={() => { setIsConnecting(prev => !prev); if (isConnecting) { setConnectionStart(null); setConnectingMousePosition(null); }}}
            className={`px-2 sm:px-3 py-1 sm:py-1.5 text-xs sm:text-sm rounded-md transition-colors ${isConnecting ? 'bg-orange-100 text-orange-700 border border-orange-300' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
            data-tour-id="connect-nodes-button"
          >
            {isConnecting ? 'Connecting...' : 'Connect Nodes'}
          </button>
          <button onClick={generateCodeFromFlowchart} disabled={flowchartData.nodes.length === 0} className="flex items-center px-2 sm:px-3 py-1 sm:py-1.5 text-xs sm:text-sm text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors" data-tour-id="generate-code-button">
            <Zap className="w-3 h-3 sm:w-4 sm:h-4 mr-1" />Generate Code
          </button>
          <button onClick={() => onRunCode(generatedCode)} disabled={!generatedCode || isRunning} className="flex items-center px-2 sm:px-3 py-1 sm:py-1.5 text-xs sm:text-sm text-white bg-emerald-600 rounded-md hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors" data-tour-id="run-code-button">
            <Play className="w-3 h-3 sm:w-4 sm:h-4 mr-1" />{isRunning ? 'Running...' : 'Run'}
          </button>
          <button onClick={clearCanvas} className="flex items-center px-2 sm:px-3 py-1 sm:py-1.5 text-xs sm:text-sm text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors">
            <RotateCcw className="w-3 h-3 sm:w-4 sm:h-4 mr-1" />Clear
          </button>
          <button onClick={triggerImageUpload} className="flex items-center px-2 sm:px-3 py-1 sm:py-1.5 text-xs sm:text-sm text-white bg-teal-600 rounded-md hover:bg-teal-700 transition-colors" title="Import Flowchart from Image">
            <Upload className="w-3 h-3 sm:w-4 sm:h-4 mr-1" />Import
          </button>
          <input type="file" ref={fileInputRef} accept="image/jpeg, image/png" onChange={handleImageFileSelect} data-testid="flowchart-image-upload-input" className="hidden" />
          <button onClick={() => setIsPropertiesOpen(!isPropertiesOpen)} className="p-1.5 hover:bg-gray-200 rounded-md ml-1 sm:ml-2 md:hidden" title={isPropertiesOpen ? "Hide Properties" : "Show Properties"}>
            <Settings2 size={20} />
          </button>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {isPaletteOpen && (
          <div className={`border-r border-gray-200 p-4 flex-shrink-0 bg-white w-full sm:w-48 md:w-56 lg:w-64 absolute sm:relative z-10 sm:z-0 h-full sm:h-auto overflow-y-auto sm:overflow-y-visible ${isPaletteOpen ? 'block' : 'hidden'}`}>
            <h4 className="text-sm font-semibold text-gray-900 mb-4">Flowchart Elements</h4>
            <div className="space-y-2">
              {nodePalette.map((node) => (
                <div key={node.type} draggable onDragStart={() => handleDragStart(node.type)} className={`p-3 rounded-lg border-2 border-dashed cursor-move transition-all hover:shadow-md ${node.color}`}>
                  <div title={node.description} className="flex items-center">
                    {node.icon}<span className="ml-2 font-medium text-sm">{node.label}</span>
                  </div>
                </div>
              ))}
            </div>
            {exercise.requiredNodes && (
              <div className="mt-6 p-3 bg-blue-50 rounded-lg border border-blue-200">
                <h5 className="text-sm font-semibold text-blue-900 mb-2">Required Elements</h5>
                <div className="space-y-1">
                  {exercise.requiredNodes.map((nodeType) => {
                    const hasNode = flowchartData.nodes.some(n => n.type === nodeType);
                    return (<div key={nodeType} className="flex items-center text-xs">
                      <div className={`w-2 h-2 rounded-full mr-2 ${hasNode ? 'bg-emerald-500' : 'bg-gray-300'}`} />
                      <span className={hasNode ? 'text-emerald-700' : 'text-gray-600'}>{nodeType.charAt(0).toUpperCase() + nodeType.slice(1)}</span>
                    </div>);
                  })}
                </div>
              </div>
            )}
          </div>
        )}

        <div ref={canvasRef} className="flex-1 relative overflow-auto bg-gray-50 flowchart-dots-bg" onDragOver={handleDragOver} onDrop={handleDrop} onMouseMove={handleCanvasMouseMove} onMouseUp={handleDragEnd} onClick={handleCanvasClick} onWheel={handleWheelZoom}>
            <div className="relative w-full h-full" style={{ transform: `scale(${zoomLevel})`, transformOrigin: 'top left' }}>
                {isGeneratingFlowchart && (
                  <div className="absolute inset-0 bg-gray-500 bg-opacity-50 flex items-center justify-center z-50" style={{transform: `scale(${1/zoomLevel})`, transformOrigin: 'center center' }}>
                    <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-blue-500"></div>
                    <p className="ml-3 text-white font-semibold">Generating Flowchart...</p>
                  </div>
                )}
                <svg
                  viewBox="0 0 4000 4000"
                  preserveAspectRatio="xMidYMid meet"
                  className="absolute inset-0 w-full h-full pointer-events-none"
                >
                  {isConnecting && connectionStart && connectingMousePosition && (() => {
                    const sourceNode = flowchartData.nodes.find(n => n.id === connectionStart);
                    if (!sourceNode || !sourceNode.position) return null;
                    const x1 = sourceNode.position.x + 64; const y1 = sourceNode.position.y + 32;
                    return <line x1={x1} y1={y1} x2={connectingMousePosition.x} y2={connectingMousePosition.y} stroke="#2563eb" strokeWidth="2" strokeDasharray="5,5" />;
                  })()}
                  {flowchartData.edges.map((edge) => {
                    const sourceNode = flowchartData.nodes.find(n => n.id === edge.source);
                    const targetNode = flowchartData.nodes.find(n => n.id === edge.target);
                    if (!sourceNode || !sourceNode.position || !targetNode || !targetNode.position) {
                      console.error("FlowchartBuilder: Skipping edge render due to missing source/target node or position", edge, sourceNode, targetNode);
                      return null;
                    }
                    const x1 = sourceNode.position.x + 64; const y1 = sourceNode.position.y + 32;
                    const x2 = targetNode.position.x + 64; const y2 = targetNode.position.y + 32;
                    return (
                      <g key={edge.id}>
                        <line x1={x1} y1={y1} x2={x2} y2={y2} stroke="red" strokeWidth="5" />
                        <circle cx={(x1 + x2) / 2} cy={(y1 + y2) / 2} r="8" fill="white" stroke="#ef4444" strokeWidth="1" className="cursor-pointer pointer-events-auto" onClick={() => handleDeleteEdge(edge.id)}><title>Delete</title></circle>
                        <text x={(x1 + x2) / 2} y={(y1 + y2) / 2 + 1} textAnchor="middle" className="text-xs fill-red-600 pointer-events-none">×</text>
                      </g>
                    );
                  })}
                  {/* <defs> Marker definition was here, removed for testing edge visibility </defs> */}
                </svg>

            {flowchartData.nodes.map((node) => {
              const positionX = typeof node.position?.x === 'number' ? node.position.x : 0;
              const positionY = typeof node.position?.y === 'number' ? node.position.y : 0;
              if (typeof node.position?.x !== 'number' || typeof node.position?.y !== 'number') {
                // This log is now less critical if nodes appear due to centering, but good for sanity check
                // console.error("FlowchartBuilder: Node position issue", node);
              }
              return (
              <div
                key={node.id}
                className={`absolute w-32 h-16 rounded-lg border-2 cursor-pointer transition-all hover:shadow-lg z-20 ${getNodeStyle(node.type)} ${selectedNodeForProperties === node.id ? 'ring-2 ring-blue-500 ring-offset-2' : ''} ${highlightedNodeId === node.id ? 'ring-4 ring-purple-500 ring-offset-2' : ''}`}
                style={{ left: positionX, top: positionY, transform: node.type === 'decision' ? 'rotate(45deg)' : 'none', cursor: draggingNodeId === node.id ? 'grabbing' : 'grab' }}
                onClick={() => handleNodeClick(node.id)}
                onMouseDown={(e) => handleNodeMouseDown(e, node.id)}
              >
                <div className={`w-full h-full flex items-center justify-center p-2 ${node.type === 'decision' ? 'transform -rotate-45' : ''}`} title={node.data.label} >
                  <span className="text-xs font-medium text-center leading-tight block truncate overflow-hidden text-ellipsis">{node.data.label}</span>
                </div>
                {selectedNodeForProperties === node.id && (
                  <button onClick={(e) => { e.stopPropagation(); handleDeleteNode(node.id);}} className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600 transition-colors z-30" title="Delete node">
                    <Trash2 className="w-3 h-3" />
                  </button>
                )}
              </div>
               );
            })}

            {otherUsersOnFlowchart.map(user => {
              if (!user.currentNodeId) return null;
              const targetNode = flowchartData.nodes.find(n => n.id === user.currentNodeId);
              if (!targetNode || !targetNode.position) return null;
              const positionX = targetNode.position.x; const positionY = targetNode.position.y;
              const bubbleX = positionX + 128 - 8; const bubbleY = positionY - 8;
              return (
                <div key={user.uid} className="absolute w-7 h-7 rounded-full flex items-center justify-center border-2 border-white shadow-lg z-30" style={{ left: bubbleX, top: bubbleY, backgroundColor: user.photoURL ? undefined : '#A0AEC0' }} title={user.displayName || 'User'}>
                  {user.photoURL ? <img src={user.photoURL} alt={user.displayName || ''} className="w-full h-full rounded-full object-cover" /> : <UserIcon size={14} className="text-white" />}
                </div>
              );
            })}

            {flowchartData.nodes.length === 0 && !isGeneratingFlowchart && (
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="text-center text-gray-500">
                  <Zap className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p className="text-lg font-medium mb-2">Start Building Your Flowchart</p>
                  <p className="text-sm">Drag elements from the left panel or use Chat AI to generate.</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {selectedNodeData && isPropertiesOpen && (
          <div className={`border-l border-gray-200 p-4 flex-shrink-0 bg-white w-full sm:w-60 md:w-72 lg:w-80 absolute sm:relative right-0 sm:right-auto z-10 sm:z-0 h-full sm:h-auto overflow-y-auto sm:overflow-y-visible ${isPropertiesOpen ? 'block' : 'hidden'}`}>
            <div className="flex justify-between items-center mb-4">
              <h4 className="text-sm font-semibold text-gray-900">Node Properties</h4>
              <button onClick={() => { setSelectedNodeForProperties(null); if (currentUser) { const db = getDatabase(app); update(ref(db, `onlineUsers/${currentUser.uid}`), { currentNodeId: null, lastSeen: serverTimestamp() }); }}} className="p-1 hover:bg-gray-200 rounded-md text-gray-600 hover:text-gray-800" title="Close Properties"><X size={18} /></button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Label</label>
                <input type="text" value={selectedNodeData.data.label} onChange={(e) => handleNodeUpdate(selectedNodeData!.id, { label: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
              </div>
              {(selectedNodeData.type === 'process' || selectedNodeData.type === 'output') && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{selectedNodeData.type === 'process' ? 'Expression' : 'Output Value'}</label>
                  <textarea value={selectedNodeData.data.value || ''} onChange={(e) => handleNodeUpdate(selectedNodeData!.id, { value: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent" rows={3} placeholder={selectedNodeData.type === 'process' ? 'e.g., sum = a + b' : 'e.g., sum'} />
                </div>
              )}
              {selectedNodeData.type === 'decision' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Condition</label>
                  <input type="text" value={selectedNodeData.data.condition || ''} onChange={(e) => handleNodeUpdate(selectedNodeData!.id, { condition: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent" placeholder="e.g., n % 2 == 0" />
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {generatedCode && (
        <div className="border-t border-gray-200 p-4 bg-gray-50">
          <h4 className="text-sm font-semibold text-gray-900 mb-2">Generated Code</h4>
          <pre className="text-xs bg-white p-3 rounded border overflow-x-auto"><code>{generatedCode}</code></pre>
        </div>
      )}
    </div>
  );
};