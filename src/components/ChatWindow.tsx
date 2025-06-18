import React, { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import { MessageSquare, Send, X } from 'lucide-react';
import type { FlowchartData } from '../types';

interface ChatWindowProps {
  onClose: () => void;
  onFlowchartGenerated: (flowchartData: FlowchartData) => void;
}

interface BackendResponse {
  response: string;
  isStructuredData?: boolean;
}

interface ChatMessage {
  id: string;
  text: string;
  sender: 'user' | 'ai';
  isError?: boolean;
  isStructuredData?: boolean;
}

const markdownComponents = {
  h1: ({node, ...props}) => <h1 className="text-lg font-bold mt-2 mb-1" {...props} />,
  h2: ({node, ...props}) => <h2 className="text-md font-semibold mt-2 mb-1" {...props} />,
  h3: ({node, ...props}) => <h3 className="text-base font-semibold mt-1 mb-1" {...props} />,
  p: ({node, ...props}) => <p className="mb-2" {...props} />,
  strong: ({node, ...props}) => <strong className="font-bold" {...props} />,
  em: ({node, ...props}) => <em className="italic" {...props} />,
  ul: ({node, ...props}) => <ul className="list-disc list-inside mb-2 pl-4" {...props} />,
  ol: ({node, ...props}) => <ol className="list-decimal list-inside mb-2 pl-4" {...props} />,
  li: ({node, ...props}) => <li className="mb-1" {...props} />,
  a: ({node, ...props}) => <a className="text-blue-500 hover:underline" target="_blank" rel="noopener noreferrer" {...props} />,
  code: ({node, inline, className, children, ...props}) => {
    if (inline) {
      return <code className="bg-gray-200 text-gray-700 px-1 py-0.5 rounded text-xs" {...props}>{children}</code>;
    }
    return <code className={className} {...props}>{children}</code>;
  },
  pre: ({node, ...props}) => <pre className="bg-gray-800 text-gray-100 p-2 rounded-md overflow-x-auto text-xs my-2 whitespace-pre-wrap" {...props} />,
};

export const ChatWindow: React.FC<ChatWindowProps> = ({ onClose, onFlowchartGenerated }) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [currentMessage, setCurrentMessage] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);

  // Always use production endpoint
  const apiBaseUrl = "https://flowchart-to-code-learning-1.onrender.com";
  const chatEndpoint = `${apiBaseUrl}/api/chat`;

  const handleSendMessage = async () => {
    if (currentMessage.trim() === '') return;

    setIsLoading(true);

    const textForUserMessage = currentMessage;
    setCurrentMessage('');

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      text: textForUserMessage,
      sender: 'user',
    };
    setMessages(prevMessages => [...prevMessages, userMessage]);

    try {
      const response = await fetch(chatEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ message: textForUserMessage }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ detail: 'Server error. Please try again.' }));
        setMessages(prevMessages => [
          ...prevMessages,
          {
            id: (Date.now() + 1).toString(),
            text: `Error: ${errorData.detail || 'Failed to get response from server.'}`,
            sender: 'ai',
            isError: true,
          },
        ]);
        return;
      }

      const data: BackendResponse = await response.json();

      const aiResponse: ChatMessage = {
        id: (Date.now() + 1).toString(),
        text: data.response,
        sender: 'ai',
        isStructuredData: data.isStructuredData === true,
      };
      setMessages(prevMessages => [...prevMessages, aiResponse]);

      if (data.isStructuredData && data.response) {
        try {
          const aiOutput = JSON.parse(data.response);
          if (aiOutput && Array.isArray(aiOutput.nodes) && Array.isArray(aiOutput.edges)) {
            const transformedNodes = aiOutput.nodes.map((node: any) => ({
              id: node.id,
              type: node.type,
              position: node.position,
              data: { label: node.label },
            }));
            const transformedFlowchartData: FlowchartData = {
              nodes: transformedNodes,
              edges: aiOutput.edges,
            };
            onFlowchartGenerated(transformedFlowchartData);
            console.log("ChatWindow: Sent transformed structured flowchart data to App.tsx", transformedFlowchartData);
          } else {
            console.warn("ChatWindow: Received structured data flag from AI, but content was not in expected {nodes: [], edges: []} format:", aiOutput);
          }
        } catch (parseError) {
          console.error("ChatWindow: Failed to parse structured flowchart data from AI:", parseError, data.response);
        }
      }

    } catch (error) {
      setMessages(prevMessages => [
        ...prevMessages,
        {
          id: (Date.now() + 1).toString(),
          text: 'Error: Could not connect to the AI service. Please check your connection or try again later.',
          sender: 'ai',
          isError: true,
        },
      ]);
    } finally {
      setIsLoading(false);
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
              ) : msg.sender === 'ai' && !msg.isError ? (
                <ReactMarkdown components={markdownComponents}>{msg.text}</ReactMarkdown>
              ) : (
                msg.text.split('\n').map((line, index) => (
                  <React.Fragment key={index}>
                    {line}
                    {index < msg.text.split('\n').length - 1 && <br />}
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
                e.preventDefault();
                handleSendMessage();
              }
            }}
            placeholder="Type /learn or /generate..."
            disabled={isLoading}
            className={`flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm ${isLoading ? 'bg-gray-100' : ''}`}
          />
          <button
            onClick={handleSendMessage}
            disabled={currentMessage.trim() === '' || isLoading}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
          >
            {isLoading ? (
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            ) : (
              <Send size={18} />
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
