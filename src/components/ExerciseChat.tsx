import React, { useState, useEffect, useRef } from 'react';
import toast from 'react-hot-toast'; // Import toast
import { marked } from 'marked'; // Import marked library
import useChatStore from '../store/chatStore';
import { postRealChatMessage } from '../services/api';
import './ExerciseChat.css';

interface ExerciseChatProps {
  onChatInteraction: () => void;
  isChatForcedOpen?: boolean;
}

const ExerciseChat: React.FC<ExerciseChatProps> = ({ onChatInteraction, isChatForcedOpen }) => {
  const {
    isVisible,
    toggleVisibility,
    openChat: openChatInStore, // Renamed to avoid conflict
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

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(scrollToBottom, [messages]);

  // Effect to handle forced open state
  useEffect(() => {
    if (isChatForcedOpen && !isVisible) {
      openChatInStore(); // Open the chat via store action
    }
  }, [isChatForcedOpen, isVisible, openChatInStore]);

  useEffect(() => {
    if (isVisible && currentExerciseId && exerciseContext?.title) {
      const currentMessages = loadHistory(currentExerciseId);
      if (currentMessages.length === 0) {
        // Add a more guiding initial message
        let initialText = `Hi 👋 I’m FlowBot! Ready to help you with "${exerciseContext.title}".`;
        if (isChatForcedOpen) {
          initialText += "\n\nLet's discuss the concepts first. When you're ready to build the flowchart, just send any message or ask a question!";
        }
        const greetingMessage = {
          id: Date.now().toString() + '-greeting',
          sender: 'assistant' as 'assistant',
          text: initialText,
          timestamp: Date.now(),
        };
        addMessage(currentExerciseId, greetingMessage);
      }
    }
  }, [isVisible, currentExerciseId, exerciseContext, addMessage, loadHistory, isChatForcedOpen]);

  // Show minimized button only if not forced open and not visible
  if (!isVisible && !isChatForcedOpen) {
    return (
      <button
        onClick={openChatInStore} // Use openChatInStore to ensure visibility is correctly set in store
        className="chat-widget-button"
      >
        Open Chat
      </button>
    );
  }

  // If forced open but not yet visible (e.g. store state hasn't updated), show nothing briefly or a loader.
  // Or, rely on the useEffect to call openChatInStore, then this condition won't be met for long.
  if (!isVisible && isChatForcedOpen) {
      return null; // Or a loading indicator if preferred
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
      onChatInteraction(); // Notify App.tsx that user has interacted

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

      try {
        const apiResponse = await postRealChatMessage({
          message: messageContent,
          command: command,
          exerciseContext: storeExerciseContext ? {
            currentExerciseId: storeExerciseContext.exerciseId,
            title: storeExerciseContext.title,
          } : null,
        });

        if (currentExerciseId) {
          const botReply = apiResponse.reply;
          if (command === 'generate' && botReply.isStructuredData && botReply.text) {
            try {
              const flowchartData = JSON.parse(botReply.text);
              if (flowchartData.nodes && flowchartData.edges) {
                setGeneratedFlowchartData(flowchartData);
                useChatStore.getState().setIsCheatModeSource(true); // Set cheat mode source
                 addMessage(currentExerciseId, {
                   id: Date.now().toString() + '-flowchart-generated',
                   sender: 'assistant',
                   text: "Flowchart generated. You can see it on the canvas.",
                   timestamp: Date.now(),
                 });
                toast.success("Flowchart generated in cheat mode – progress not counted.");
                console.log("Flowchart data parsed and set to store from chat message.");
              } else {
                // Structured data was expected but not in the correct format
                const formatError = "Flowchart data is missing nodes or edges.";
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
        <input
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
          className="chat-input"
          placeholder="Type a message..."
        />
        <button onClick={handleSendMessage} className="chat-send-button">
          Send
        </button>
      </div>
    </div>
  );
};

export default ExerciseChat;
