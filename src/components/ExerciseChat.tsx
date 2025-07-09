import React, { useState, useEffect, useRef } from 'react';
import toast from 'react-hot-toast'; // Import toast
import { marked } from 'marked'; // Import marked library
import useChatStore from '../store/chatStore';
import { postRealChatMessage } from '../services/api';
import './ExerciseChat.css';

const ExerciseChat: React.FC = () => {
  const {
    isVisible,
    toggleVisibility,
    currentExerciseId,
    exerciseContext,
    addMessage,
    loadHistory,
    requestResync,
    setGeneratedFlowchartData,
    setIsGeneratingFlowchart, // Get the setter for loading state
  } = useChatStore();
  const storeExerciseContext = useChatStore((state) => state.exerciseContext);

  const [inputValue, setInputValue] = useState('');
  const [isBotTyping, setIsBotTyping] = useState(false);
  const [isFullScreen, setIsFullScreen] = useState(false); // Added for full-screen mode
  const messages = currentExerciseId ? loadHistory(currentExerciseId) : [];
  const messagesEndRef = useRef<null | HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null); // Ref for the input element

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(scrollToBottom, [messages]);

  useEffect(() => {
    if (isVisible && currentExerciseId && exerciseContext?.title) {
      const currentMessages = loadHistory(currentExerciseId);
      if (currentMessages.length === 0) {
        const greetingMessage = {
          id: Date.now().toString() + '-greeting',
          sender: 'assistant' as 'assistant',
          text: `Hi 👋 I’m FlowBot! Ready to help you with "${exerciseContext.title}".`,
          timestamp: Date.now(),
        };
        addMessage(currentExerciseId, greetingMessage);
      }
    }
  }, [isVisible, currentExerciseId, exerciseContext, addMessage, loadHistory]);

  if (!isVisible) {
    return (
      <button
        onClick={toggleVisibility}
        className="chat-widget-button"
      >
        Open Chat
      </button>
    );
  }

  const handleSendMessage = async () => {
    if (inputValue.trim() && currentExerciseId) {
      const userMessage = {
        id: Date.now().toString(),
        sender: 'user' as 'user',
        text: inputValue,
        timestamp: Date.now(),
      };
      addMessage(currentExerciseId, userMessage);
      setInputValue('');
      setIsBotTyping(true);

      console.log("[DEBUG] User message text at start of handleSendMessage:", userMessage.text); // DEBUG LOG

      let command: 'chat' | 'learn' | 'generate' = 'chat';
      let messageContent = userMessage.text;

      if (userMessage.text.toLowerCase().startsWith('/generate ')) {
        command = 'generate';
        messageContent = userMessage.text.substring('/generate '.length).trim();
        setIsGeneratingFlowchart(true); // Start loading before API call
      } else if (userMessage.text.toLowerCase().startsWith('/learn ')) {
        command = 'learn';
        messageContent = userMessage.text.substring('/learn '.length).trim();
      }

      // Determine what to send to the API
      // If it's a known command, send the original text so the backend can parse it.
      // Otherwise, send the processed messageContent (which is the same as userMessage.text for 'chat').
      const messageForApi = (command === 'learn' || command === 'generate') ? userMessage.text : messageContent;

      const apiPayload = {
        message: messageForApi,
        command: command, // 'learn', 'generate', or 'chat'
        exerciseContext: storeExerciseContext ? {
          currentExerciseId: storeExerciseContext.exerciseId,
          title: storeExerciseContext.title,
        } : null,
      };

      // console.log("[DEBUG] Payload to postRealChatMessage:", apiPayload); // For debugging

      try {
        const apiResponse = await postRealChatMessage(apiPayload);

        if (currentExerciseId) {
          const botReply = apiResponse.reply;
          if (command === 'generate' && botReply.isStructuredData && botReply.text) {
            console.log("[DEBUG] Raw botReply.text for /generate:", botReply.text);
            let flowchartDataFromApi; // Renamed to avoid confusion
            try {
              flowchartDataFromApi = JSON.parse(botReply.text);
              // console.log("[DEBUG] Parsed flowchartDataFromApi (raw API structure):", JSON.stringify(flowchartDataFromApi, null, 2));

              if (flowchartDataFromApi.nodes && flowchartDataFromApi.edges) {
                // Transform API data to the internal FlowchartNode structure
                const transformedInternalNodes: import('../types').FlowchartNode[] = flowchartDataFromApi.nodes.map((apiNode: any) => ({
                  id: apiNode.id,
                  type: apiNode.type as import('../types').FlowchartNodeType,
                  position: { x: apiNode.x, y: apiNode.y },
                  data: {
                    label: apiNode.label,
                    value: apiNode.value || '',
                    condition: apiNode.condition || '',
                  },
                }));

                const transformedInternalEdges: import('../types').FlowchartEdge[] = flowchartDataFromApi.edges.map((apiEdge: any) => ({
                  id: apiEdge.id,
                  source: apiEdge.source,
                  target: apiEdge.target,
                  label: apiEdge.label || undefined,
                  type: apiEdge.type || 'default',
                }));

                const dataForStore: import('../types').FlowchartData = {
                  nodes: transformedInternalNodes,
                  edges: transformedInternalEdges,
                  // problemStatement, inputType, etc., are not part of FlowchartData type in types/index.ts
                  // If needed by FlowchartBuilder, they must be passed via other means or FlowchartData type expanded.
                };

                console.log("[DEBUG] Transformed dataForStore (to be saved in Zustand):", JSON.stringify(dataForStore, null, 2));

                // Further try-catch for setting data and UI updates
                try {
                  setGeneratedFlowchartData(dataForStore); // Pass the transformed data
                  useChatStore.getState().setIsCheatModeSource(true); // Set cheat mode source
                  addMessage(currentExerciseId, {
                    id: Date.now().toString() + '-flowchart-generated',
                    sender: 'assistant',
                    text: "Flowchart generated. You can see it on the canvas.",
                    timestamp: Date.now(),
                  });
                  toast.success("Flowchart generated in cheat mode – progress not counted.");
                  console.log("Flowchart data successfully processed and UI updated.");
                } catch (renderError) {
                  console.error("[DEBUG] Error during setGeneratedFlowchartData or subsequent UI updates:", renderError);
                  const renderErrorMessage = `Error rendering flowchart: ${renderError instanceof Error ? renderError.message : 'Unknown error'}`;
                  toast.error(renderErrorMessage);
                  addMessage(currentExerciseId, {
                    id: Date.now().toString() + '-render-error',
                    sender: 'assistant',
                    text: renderErrorMessage,
                    timestamp: Date.now(),
                  });
                }
              } else {
                // Structured data was expected but not in the correct format
                const formatError = "Flowchart data is missing nodes or edges.";
                console.error("[DEBUG] Flowchart data format error:", formatError, "Data:", flowchartData);
                toast.error(`Error: ${formatError}`);
                throw new Error(formatError);
              }
            } catch (e) {
              const parseError = `Error processing flowchart: ${e instanceof Error ? e.message : 'Invalid format.'}`;
              toast.error(parseError);
              console.error("Failed to parse structured flowchart data:", e);
              addMessage(currentExerciseId, {
                id: Date.now().toString() + '-error',
                sender: 'assistant',
                text: parseError,
                timestamp: Date.now(),
              });
            }
          } else if (command === 'generate') {
            // Handle cases where /generate was called but response was not structured or failed
            const generateError = "Failed to generate flowchart. The response was not as expected.";
            toast.error(generateError);
             addMessage(currentExerciseId, {
                id: Date.now().toString() + '-generate-error',
                sender: 'assistant',
                text: botReply.text || generateError, // Show bot's text or a generic error
                timestamp: Date.now(),
            });
          }
          else {
            // Regular message or /learn response
            addMessage(currentExerciseId, botReply);
          }
        }
      } catch (error) {
        const apiError = `API Error: ${error instanceof Error ? error.message : "Sorry, I couldn't connect to the assistant."}`;
        toast.error(apiError);
        console.error("Error sending message to API:", error);
        if (currentExerciseId) {
            addMessage(currentExerciseId, {
                id: Date.now().toString() + '-error',
                sender: 'assistant',
                text: apiError,
                timestamp: Date.now(),
            });
        }
      } finally {
        setIsBotTyping(false);
        if (command === 'generate') {
          setIsGeneratingFlowchart(false); // Stop loading after API call attempt for /generate
        }
      }
    }
  };

  const handleLearnButtonClick = () => {
    setInputValue('/learn ');
    inputRef.current?.focus();
  };

  const handleGenerateButtonClick = () => {
    setInputValue('/generate ');
    inputRef.current?.focus();
  };

  return (
    <div className={`chat-widget-container ${isFullScreen ? 'chat-widget-fullscreen' : ''}`}>
      {/* Header */}
      <div className="chat-header">
        <span className="chat-header-title">{exerciseContext?.title || 'Chat'}</span>
        <div className="chat-header-buttons">
          <button title="Re-sync" className="resync-button" onClick={requestResync}>🔄</button>
          <button title={isFullScreen ? "Exit Full Screen" : "Full Screen"} onClick={() => setIsFullScreen(!isFullScreen)}>
            {isFullScreen ? '↙️' : '↗️'}
          </button>
          <button onClick={toggleVisibility}>✕</button>
        </div>
      </div>

      {/* Message List */}
      <div className="chat-messages-list">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`chat-message ${
              msg.sender === 'user' ? 'chat-message-user' : 'chat-message-assistant'
            }`}
          >
            {msg.sender === 'assistant' ? (
              <div dangerouslySetInnerHTML={{ __html: marked(msg.text) as string }} />
            ) : (
              <div>{msg.text}</div> // User messages rendered as plain text
            )}
          </div>
        ))}
         {isBotTyping && (
            <div className="bot-typing-indicator">
              Assistant is typing...
            </div>
         )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="chat-input-area">
        <div className="chat-command-buttons">
          <button onClick={handleLearnButtonClick} className="chat-command-button">
            /learn
          </button>
          <button onClick={handleGenerateButtonClick} className="chat-command-button">
            /generate
          </button>
        </div>
        <div className="chat-input-row"> {/* Wrapper for input and send button */}
          <input
            ref={inputRef} // Assign ref to the input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
            className="chat-input"
            placeholder="Type a message or use command buttons..."
          />
          <button onClick={handleSendMessage} className="chat-send-button">
            Send
          </button>
        </div>
      </div>
    </div>
  );
};

export default ExerciseChat;
