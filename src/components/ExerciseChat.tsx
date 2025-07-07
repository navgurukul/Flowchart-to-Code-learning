import React, { useState, useEffect, useRef } from 'react';
import useChatStore, { ChatMessage } from '../store/chatStore'; // Import ChatMessage type
import { postRealChatMessage, applyFlowchartPatch, FlowchartPatchPayload } from '../services/api'; // UPDATED IMPORT
import './ExerciseChat.css'; // Import the CSS file
import { FlowchartData, FlowchartNode, FlowchartNodeType } from '../types'; // For data transformation

const ExerciseChat: React.FC = () => {
  const {
    isVisible,
    toggleVisibility,
    currentExerciseId,
    // exerciseContext, // storeExerciseContext is used directly
    addMessage,
    loadHistory,
    requestResync,
    setGeneratedFlowchartData,
    generatedFlowchartData, // Need to read current flowchart for patching
  } = useChatStore();
  const storeExerciseContext = useChatStore((state) => state.exerciseContext); // For /generate context

  const [inputValue, setInputValue] = useState('');
  const [isBotTyping, setIsBotTyping] = useState(false);
  const messages = currentExerciseId ? loadHistory(currentExerciseId) : [];
  const messagesEndRef = useRef<null | HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(scrollToBottom, [messages]);

  useEffect(() => {
    if (isVisible && currentExerciseId && storeExerciseContext?.title) { // use storeExerciseContext
      const currentMessages = loadHistory(currentExerciseId);
      if (currentMessages.length === 0) {
        const greetingMessage: ChatMessage = { // Ensure type ChatMessage
          id: Date.now().toString() + '-greeting',
          sender: 'assistant' as 'assistant',
          text: `Hi 👋 I’m FlowBot! Ready to help you with "${storeExerciseContext.title}".`,
          timestamp: Date.now(),
        };
        addMessage(currentExerciseId, greetingMessage);
      }
    }
  }, [isVisible, currentExerciseId, storeExerciseContext, addMessage, loadHistory]); // use storeExerciseContext

  const handleFixIt = async (patch: FlowchartPatchPayload) => {
    if (!currentExerciseId || !generatedFlowchartData) {
      console.error("Cannot apply patch: missing exerciseId or current flowchart data.");
      addMessage(currentExerciseId, {
        id: Date.now().toString() + '-patch-error',
        sender: 'assistant',
        text: "I tried to apply the fix, but something went wrong. I couldn't find the current flowchart data.",
        timestamp: Date.now(),
      });
      return;
    }

    setIsBotTyping(true);
    try {
      const patchedFlowchartFlat = await applyFlowchartPatch({
        current_flowchart: generatedFlowchartData, // This is FlowchartData (nested)
        patch: patch,
      });

      // Transform flat backend response to frontend's nested FlowchartData structure
      const newNodes: FlowchartNode[] = patchedFlowchartFlat.nodes.map(flatNode => ({
        id: flatNode.id,
        type: flatNode.type as FlowchartNodeType, // Assuming type is valid FlowchartNodeType
        position: { x: flatNode.x, y: flatNode.y },
        data: { label: flatNode.label },
        // width and height can be mapped to ReactFlow node styles if needed, or stored in data
      }));

      const newFlowchartData: FlowchartData = {
        nodes: newNodes,
        edges: patchedFlowchartFlat.edges, // Edges are already in the correct format
      };

      setGeneratedFlowchartData(newFlowchartData);

      addMessage(currentExerciseId, {
        id: Date.now().toString() + '-patch-applied',
        sender: 'assistant',
        text: "✅ Fix applied! The flowchart has been updated. Try running it again.",
        timestamp: Date.now(),
      });

      // TODO: Trigger "re-run" of the flowchart as per design doc's `await runFlowchart()`
      // This might involve:
      // 1. Signaling to FlowchartBuilder.tsx to re-initialize its internal state if it doesn't auto-react to `generatedFlowchartData`
      // 2. If there's a global run function/button, programmatically triggering it.
      // 3. Or, if simulation is managed here or nearby, re-init and run FlowchartSimulator.
      console.log("Flowchart patched. Next step would be to 'runFlowchart()'.");

    } catch (error) {
      console.error("Error applying flowchart patch:", error);
      let errorMessage = "Sorry, I couldn't apply the fix. An unexpected error occurred.";
      if (error instanceof Error) {
        errorMessage = `Failed to apply fix: ${error.message}`;
      }
      addMessage(currentExerciseId, {
        id: Date.now().toString() + '-patch-fail',
        sender: 'assistant',
        text: errorMessage,
        timestamp: Date.now(),
      });
    } finally {
      setIsBotTyping(false);
    }
  };


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

      let messageToSend = userMessage.text;
      const isGenerateCommand = userMessage.text.toLowerCase().startsWith('/generate ');

      if (isGenerateCommand) {
        messageToSend = userMessage.text.substring('/generate '.length).trim();
      }

      try {
        // Ensure the context being sent matches what postRealChatMessage expects.
        // The message field will now be the extracted prompt if it's a /generate command.
        const apiResponse = await postRealChatMessage({
          message: messageToSend, // Use the potentially modified message
          exerciseContext: storeExerciseContext ? {
            currentExerciseId: storeExerciseContext.exerciseId, // Map from store's structure
            title: storeExerciseContext.title,
          } : null,
          // We could add an explicit flag for the backend if it helps differentiate /generate calls
          // isGenerateFlowchartRequest: isGenerateCommand
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
            {/* Render structured error message if fields are present */}
            {msg.sender === 'assistant' && msg.originalError && (
              <div className="error-explanation-message">
                <p>❌ <strong>Error</strong>: {msg.originalError}</p>
                {msg.friendlyExplanation && <p>ℹ️ {msg.friendlyExplanation}</p>}
                {msg.suggestedFix && <p><strong>Fix suggestion:</strong> {msg.suggestedFix}</p>}
                {msg.flowchartPatch && (
                  <button
                    onClick={() => handleFixIt(msg.flowchartPatch!)}
                    className="fix-it-button"
                  >
                    Fix It 🪄
                  </button>
                )}
              </div>
            )}
            {/* Fallback to simple text if not a structured error message, or for user messages */}
            {(!msg.originalError || msg.sender === 'user') && msg.text}
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
