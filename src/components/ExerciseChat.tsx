import React, { useState, useEffect, useRef } from 'react';
import useChatStore from '../store/chatStore';
import { postRealChatMessage } from '../services/api'; // UPDATED IMPORT
import './ExerciseChat.css'; // Import the CSS file

const ExerciseChat: React.FC = () => {
  const {
    isVisible,
    toggleVisibility,
    currentExerciseId,
    exerciseContext,
    addMessage,
    loadHistory,
    requestResync,
    setGeneratedFlowchartData, // Added for AI flowchart generation
  } = useChatStore();
  const storeExerciseContext = useChatStore((state) => state.exerciseContext);

  const [inputValue, setInputValue] = useState('');
  const [isBotTyping, setIsBotTyping] = useState(false);
  const messages = currentExerciseId ? loadHistory(currentExerciseId) : [];
  const messagesEndRef = useRef<null | HTMLDivElement>(null);

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

      try {
        // Ensure the context being sent matches what postRealChatMessage expects,
        // currently it only sends data.message. The backend /api/chat also only expects "message".
        // If exerciseContext is needed by the real API, postRealChatMessage and backend must be updated.
        const apiResponse = await postRealChatMessage({
          message: userMessage.text,
          exerciseContext: storeExerciseContext ? {
            currentExerciseId: storeExerciseContext.exerciseId, // Map from store's structure
            title: storeExerciseContext.title,
          } : null,
        });

        if (currentExerciseId) {
          let messageToStore = apiResponse.reply;
          if (messageToStore.isStructuredData && messageToStore.text) {
            try {
              const flowchartData = JSON.parse(messageToStore.text);
              if (flowchartData.nodes && flowchartData.edges) {
                setGeneratedFlowchartData(flowchartData); // Update store
                // Optionally, change the text displayed in chat:
                // messageToStore = {
                //   ...messageToStore,
                //   text: "Flowchart generated! It should appear in the builder.",
                // };
                // For now, we'll keep the original JSON text in chat for debugging,
                // but also signal that it has been processed.
                console.log("Flowchart data parsed and set to store from chat message.");
              }
            } catch (e) {
              console.error("Failed to parse structured data from chat message:", e);
              // Keep original message text if parsing fails
            }
          }
          addMessage(currentExerciseId, messageToStore);
        }
      } catch (error) {
        console.error("Error sending message to API:", error);
        if (currentExerciseId) {
            addMessage(currentExerciseId, {
                id: Date.now().toString() + '-error',
                sender: 'assistant',
                text: "Sorry, I couldn't connect to the assistant. Please try again.",
                timestamp: Date.now(),
            });
        }
      } finally {
        setIsBotTyping(false);
      }
    }
  };

  return (
    <div className="chat-widget-container">
      {/* Header */}
      <div className="chat-header">
        <span className="chat-header-title">{exerciseContext?.title || 'Chat'}</span>
        <div className="chat-header-buttons">
          <button title="Re-sync" className="resync-button" onClick={requestResync}>🔄</button>
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
            {msg.text}
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
