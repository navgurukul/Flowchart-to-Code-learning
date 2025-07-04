import React, { useState, useEffect, useRef } from 'react';
import useChatStore from '../store/chatStore';
import { postChatMessage } from '../mocks/api';

const ExerciseChat: React.FC = () => {
  const {
    isVisible,
    toggleVisibility,
    currentExerciseId,
    exerciseContext,
    addMessage,
    loadHistory,
    requestResync, // Add requestResync action
  } = useChatStore();
  const storeExerciseContext = useChatStore((state) => state.exerciseContext); // Get live context

  const [inputValue, setInputValue] = useState('');
  const [isBotTyping, setIsBotTyping] = useState(false);
  const messages = currentExerciseId ? loadHistory(currentExerciseId) : [];
  const messagesEndRef = useRef<null | HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(scrollToBottom, [messages]);

  if (!isVisible) {
    return (
      <button
        onClick={toggleVisibility}
        style={{
          position: 'fixed',
          bottom: '20px',
          right: '20px',
          padding: '10px 20px',
          cursor: 'pointer',
          zIndex: 1000,
        }}
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
        // Send message to the mock API
        const apiResponse = await postChatMessage({
          message: userMessage.text,
          exerciseContext: storeExerciseContext, // Use the live context from the store
        });

        // Add bot's response to the chat
        if (currentExerciseId) { // Ensure currentExerciseId is still valid
            addMessage(currentExerciseId, apiResponse.reply);
        }
      } catch (error) {
        console.error("Error sending message to API:", error);
        // Optionally, add an error message to the chat
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
    <div
      style={{
        position: 'fixed',
        bottom: '20px',
        right: '20px',
        width: '350px',
        height: '500px',
        border: '1px solid #ccc',
        borderRadius: '8px',
        backgroundColor: 'white',
        display: 'flex',
        flexDirection: 'column',
        boxShadow: '0 4px 8px rgba(0,0,0,0.1)',
        zIndex: 1000,
      }}
    >
      {/* Header */}
      <div
        style={{
          padding: '10px',
          borderBottom: '1px solid #ccc',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          backgroundColor: '#f0f0f0',
          borderTopLeftRadius: '8px',
          borderTopRightRadius: '8px',
        }}
      >
        <span>{exerciseContext?.title || 'Chat'}</span>
        <div>
          <button title="Re-sync" style={{ marginRight: '5px' }} onClick={requestResync}>🔄</button>
          <button onClick={toggleVisibility}>✕</button>
        </div>
      </div>

      {/* Message List */}
      <div
        style={{
          flexGrow: 1,
          padding: '10px',
          overflowY: 'auto',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        {messages.map((msg) => (
          <div
            key={msg.id}
            style={{
              alignSelf: msg.sender === 'user' ? 'flex-end' : 'flex-start',
              backgroundColor: msg.sender === 'user' ? '#dcf8c6' : '#f1f0f0',
              borderRadius: '7px',
              padding: '8px 12px',
              marginBottom: '8px',
              maxWidth: '70%',
              wordWrap: 'break-word',
            }}
          >
            {msg.text}
          </div>
        ))}
         {isBotTyping && (
            <div style={{ alignSelf: 'flex-start', fontStyle: 'italic', color: '#666', padding: '8px 12px'}}>
              Assistant is typing...
            </div>
         )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div
        style={{
          padding: '10px',
          borderTop: '1px solid #ccc',
          display: 'flex',
        }}
      >
        <input
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
          style={{ flexGrow: 1, marginRight: '10px', padding: '8px' }}
          placeholder="Type a message..."
        />
        <button onClick={handleSendMessage}>Send</button>
      </div>
    </div>
  );
};

export default ExerciseChat;
