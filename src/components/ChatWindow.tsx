import React, { useState } from 'react';
import { MessageSquare, Send, X } from 'lucide-react'; // Added X
import type { FlowchartData } from '../types'; // Import FlowchartData type

interface ChatWindowProps {
  onClose: () => void;
  onFlowchartGenerated: (flowchartData: FlowchartData) => void; // New prop
}

interface BackendResponse {
  response: string;
  isStructuredData?: boolean; // Optional flag from backend
}

interface ChatMessage {
  id: string;
  text: string;
  sender: 'user' | 'ai';
  isError?: boolean;
  isStructuredData?: boolean; // Add this to store the type of AI message
}

export const ChatWindow: React.FC<ChatWindowProps> = ({ onClose, onFlowchartGenerated }) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [currentMessage, setCurrentMessage] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const handleSendMessage = async () => {
    if (currentMessage.trim() === '') return;

    setIsLoading(true); // Set loading true

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      text: currentMessage,
      sender: 'user',
    };

    // Add user's message to messages list immediately
    setMessages(prevMessages => [...prevMessages, userMessage]);
    const messageToSend = currentMessage;
    setCurrentMessage('');

    try {
      const response = await fetch('http://localhost:8000/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ message: messageToSend }),
      });

      if (!response.ok) {
        // Handle HTTP errors (e.g., 404, 500)
        const errorData = await response.json().catch(() => ({ detail: 'Server error. Please try again.' }));
        // console.error('API Error:', errorData); // Already have this
        setMessages(prevMessages => [
          ...prevMessages,
          {
            id: (Date.now() + 1).toString(),
            // Ensure the error message is clearly an error
            text: `Error: ${errorData.detail || 'Failed to get response from server.'}`,
            sender: 'ai', // Consider a different sender type or styling for errors
            isError: true, // Add an optional isError flag
          },
        ]);
        return; // Return early after handling error
      }

      // const data = await response.json(); // This line is already there
      const data: BackendResponse = await response.json(); // Explicitly type it

      const aiResponse: ChatMessage = {
        id: (Date.now() + 1).toString(),
        text: data.response,
        sender: 'ai',
        isStructuredData: data.isStructuredData === true, // Store the flag
      };
      setMessages(prevMessages => [...prevMessages, aiResponse]);

      // New logic: If it's structured data, parse it and call the callback
      if (data.isStructuredData && data.response) {
        try {
          // Assuming AI sends nodes as: { id: string, label: string, type: string, position: {x: number, y: number} }
          // And edges as: { id: string, source: string, target: string }
          const aiOutput = JSON.parse(data.response);

          if (aiOutput && Array.isArray(aiOutput.nodes) && Array.isArray(aiOutput.edges)) {
            // Transform nodes to meet the FlowchartNode structure, specifically the data.label part
            const transformedNodes = aiOutput.nodes.map((node: any) => ({
              id: node.id,
              type: node.type,
              position: node.position,
              // Create the nested 'data' object with 'label'
              data: {
                label: node.label,
                // value and condition will be undefined, which is fine as they are optional in FlowchartNodeData
              },
            }));

            // Create the transformed FlowchartData object
            const transformedFlowchartData: FlowchartData = {
              nodes: transformedNodes,
              edges: aiOutput.edges, // Edges structure from AI should be compatible
            };

            onFlowchartGenerated(transformedFlowchartData);
            console.log("ChatWindow: Sent transformed structured flowchart data to App.tsx", transformedFlowchartData);
          } else {
            console.warn("ChatWindow: Received structured data flag from AI, but content was not in expected {nodes: [], edges: []} format:", aiOutput);
          }
        } catch (parseError) {
          console.error("ChatWindow: Failed to parse structured flowchart data from AI:", parseError, data.response);
          // Optionally, inform the user via chat message that parsing failed for the flowchart data
          // For now, the raw JSON string is already in aiResponse.text and will be displayed.
        }
      }

    } catch (error) {
      // console.error('Failed to send message or parse response:', error); // Already have this
      setMessages(prevMessages => [
        ...prevMessages,
        {
          id: (Date.now() + 1).toString(),
          text: 'Error: Could not connect to the AI service. Please check your connection or try again later.',
          sender: 'ai', // Consider a different sender type or styling for errors
          isError: true, // Add an optional isError flag
        },
      ]);
    } finally {
      setIsLoading(false); // Set loading false in finally
    }
  };

  return (
    <div className="fixed bottom-4 right-4 w-96 bg-white rounded-lg shadow-xl border border-gray-200 flex flex-col h-[500px] z-50">
      {/* Header */}
      <div className="flex items-center justify-between p-3 border-b border-gray-200 bg-gray-50 rounded-t-lg">
        <div className="flex items-center">
          <MessageSquare size={20} className="text-blue-600 mr-2" />
          <h3 className="text-md font-semibold text-gray-800">AI Chat</h3>
        </div>
        <button
          onClick={onClose}
          className='p-1 rounded-md hover:bg-gray-200'
          title='Close Chat'
          aria-label='Close AI Chat'
        >
          <X size={20} className='text-gray-600' />
        </button>
      </div>

      {/* Message Display Area */}
      <div className="flex-1 p-4 space-y-3 overflow-y-auto bg-gray-100">
        {messages.map(msg => (
          <div
            key={msg.id}
            className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[70%] p-2.5 rounded-lg text-sm ${
                msg.sender === 'user'
                  ? 'bg-blue-500 text-white rounded-br-none'
                  : msg.isError
                  ? 'bg-red-100 text-red-700 border border-red-300 rounded-bl-none'
                  : 'bg-white text-gray-800 border border-gray-200 rounded-bl-none'
              }`}
            >
              {msg.isStructuredData ? (
                <pre className="whitespace-pre-wrap text-xs bg-gray-800 text-gray-100 p-2 rounded-md overflow-x-auto">
                  <code>{msg.text}</code>
                </pre>
              ) : (
                // For regular text, allow line breaks to render
                msg.text.split('\n').map((line, index) => (
                  <React.Fragment key={index}>
                    {line}
                    <br />
                  </React.Fragment>
                ))
              )}
            </div>
          </div>
        ))}
        {messages.length === 0 && (
          <div className="text-center text-gray-400 text-sm mt-4">
            Type a message to start chatting...
          </div>
        )}
        {isLoading && (
          <div className="flex justify-start">
            <div className="max-w-[70%] p-2.5 rounded-lg text-sm bg-gray-200 text-gray-600 rounded-bl-none animate-pulse">
              AI is thinking...
            </div>
          </div>
        )}
      </div>

      {/* Input Area */}
      <div className="p-3 border-t border-gray-200 bg-white rounded-b-lg">
        <div className="flex items-center space-x-2">
          <input
            type="text"
            value={currentMessage}
            onChange={(e) => setCurrentMessage(e.target.value)}
            onKeyPress={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault(); // Prevent newline on Enter
                handleSendMessage();
              }
            }}
            placeholder="Type /learn or /generate..."
            disabled={isLoading} // Add this
            className={`flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm ${isLoading ? 'bg-gray-100' : ''}`} // Optional: style when disabled
          />
          <button
            onClick={handleSendMessage}
            disabled={currentMessage.trim() === '' || isLoading} // Add isLoading here
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
          >
            {isLoading ? (
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div> // Simple spinner
            ) : (
              <Send size={18} />
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
