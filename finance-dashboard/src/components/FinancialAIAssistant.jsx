
import React, { useState, useRef, useEffect } from 'react';
import { Bot, Send, X } from 'lucide-react';

const FinancialAIAssistant = ({ transactions = [] }) => {
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      content: 'Hello! Ask me anything about your transactions.',
      timestamp: new Date(),
    }
  ]);
  const [query, setQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef(null);

  // Auto-scroll to bottom
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  // No file upload needed; data comes from props

  // Call Gemini API
  const callGemini = async (prompt) => {
    try {
      const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
      if (!apiKey) {
        throw new Error('VITE_GEMINI_API_KEY not found in environment variables');
      }

      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=${apiKey}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [{
            parts: [{
              text: prompt
            }]
          }],
          generationConfig: {
            temperature: 0.7,
            topK: 40,
            topP: 0.95,
            maxOutputTokens: 2048,
          }
        })
      });

      if (!response.ok) {
        throw new Error(`API request failed: ${response.status}`);
      }

      const data = await response.json();
      return data.candidates[0].content.parts[0].text;
    } catch (error) {
      console.error('Gemini API Error:', error);
      throw error;
    }
  };

  // Handle user question
  const handleAskQuestion = async () => {
    if (!query.trim() || isLoading) return;

    const userQuestion = query;
    setMessages(prev => [...prev, {
      role: 'user',
      content: userQuestion,
      timestamp: new Date()
    }]);

    setQuery('');
    setIsLoading(true);

    try {
      // Only use transactions for the prompt
      const prompt = `You are a financial analyst. Here is the user's transaction data in JSON format:

Transactions (${transactions.length} records):
${JSON.stringify(transactions, null, 2)}

User Question: ${userQuestion}

Please analyze this transaction data and provide a short answers to the point answer with numbers and analysis. Use markdown formatting for better readability.

- Use ## for headers, **bold** for emphasis, and - for bullet points

Answer the user's question directly using the actual data provided.`;

      const response = await callGemini(prompt);

      setMessages(prev => [...prev, {
        role: 'assistant',
        content: response,
        timestamp: new Date()
      }]);

    } catch (error) {
      console.error('Error:', error);
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: `❌ Sorry, I encountered an error: ${error.message}. Please check your API key configuration.`,
        timestamp: new Date()
      }]);
    }

    setIsLoading(false);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleAskQuestion();
    }
  };

  // Simple markdown renderer
  const MarkdownRenderer = ({ content }) => {
    const parseMarkdown = (text) => {
      return text
        .replace(/## (.*?)(?=\n|$)/g, '<h3 class="text-lg font-bold text-gray-800 mb-2 mt-4">$1</h3>')
        .replace(/### (.*?)(?=\n|$)/g, '<h4 class="text-md font-semibold text-gray-700 mb-2 mt-3">$1</h4>')
        .replace(/\*\*(.*?)\*\*/g, '<strong class="font-semibold text-gray-900">$1</strong>')
        .replace(/\*(.*?)\*/g, '<em class="italic">$1</em>')
        .replace(/- (.*?)(?=\n|$)/g, '<div class="flex items-start gap-2 mb-1"><span class="text-blue-500 mt-1">•</span><span>$1</span></div>')
        .replace(/\n\n/g, '<br class="mb-2" />')
        .replace(/\n/g, '<br />');
    };

    return (
      <div 
        className="markdown-content"
        dangerouslySetInnerHTML={{ __html: parseMarkdown(content) }}
      />
    );
  };


  return (
    <div className="flex flex-col h-full max-w-4xl mx-auto rounded-2xl shadow-2xl border border-[var(--border-primary)] bg-[var(--surface-primary)]">
      {/* Header */}
      <div className="p-4 border-b border-[var(--border-primary)] bg-[var(--accent-steel-blue)]/10 dark:bg-[var(--accent-soft-purple)]/10 rounded-t-2xl">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-[var(--surface-tertiary)] flex items-center justify-center border border-[var(--accent-steel-blue)]/30">
            <Bot size={20} className="text-[var(--accent-steel-blue)]" />
          </div>
          <div>
            <h3 className="font-semibold text-lg text-[var(--accent-steel-blue)] dark:text-[var(--accent-soft-purple)]">Financial AI Assistant</h3>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-[var(--surface-primary)]">
      {messages.map((msg, i) => (
        <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
        <div className={`max-w-[85%] ${msg.role === 'user' ? 'order-2' : 'order-1'}`}>
          <div className={`p-3 rounded-2xl border shadow-sm ${
            msg.role === 'user' 
              ? 'bg-[var(--accent-steel-blue)] text-white rounded-br-md border-[var(--accent-steel-blue)]' 
              : 'bg-[var(--surface-tertiary)] rounded-bl-md border-[var(--border-secondary)]'
          }`}>
            <div className={
              msg.role === 'assistant'
                ? 'text-sm leading-relaxed text-[var(--text-primary)] dark:text-[var(--text-accent)]'
                : 'text-sm leading-relaxed text-white'
            }>
              {msg.role === 'assistant' ? (
                <MarkdownRenderer content={msg.content} />
              ) : (
                <div className="whitespace-pre-line">{msg.content}</div>
              )}
            </div>
            <div className={`text-xs mt-2 ${
              msg.role === 'user' ? 'text-white' : 'text-[var(--text-tertiary)]'
            }`}>
              {msg.timestamp.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
            </div>
          </div>
        </div>
        </div>
      ))}

      {isLoading && (
        <div className="flex justify-start">
        <div className="bg-[var(--surface-tertiary)] rounded-2xl rounded-bl-md p-4 border border-[var(--border-secondary)]">
          <div className="flex items-center gap-2">
          <div className="w-2 h-2 bg-[var(--accent-steel-blue)] rounded-full animate-pulse"></div>
          <div className="w-2 h-2 bg-[var(--accent-steel-blue)] rounded-full animate-pulse delay-75"></div>
          <div className="w-2 h-2 bg-[var(--accent-steel-blue)] rounded-full animate-pulse delay-150"></div>
          <span className="text-sm text-[var(--text-secondary)] ml-2">Analyzing your data...</span>
          </div>
        </div>
        </div>
      )}
      <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="p-4 border-t border-[var(--border-primary)] bg-[var(--accent-steel-blue)]/10 dark:bg-[var(--accent-soft-purple)]/10 rounded-b-2xl">
      <div className="relative">
        <input
        type="text"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={"Ask me anything about your financial data..."}
        className="w-full p-3 pr-12 border-[var(--border-secondary)] rounded-full focus:outline-none text-sm bg-[var(--surface-tertiary)] placeholder-[var(--text-tertiary)] text-[var(--text-primary)] transition-all duration-200"
        disabled={isLoading}
        />
        <button
        onClick={handleAskQuestion}
        disabled={isLoading || !query.trim()}
        className="absolute right-2 top-1/2 transform -translate-y-1/2 p-2 bg-[var(--accent-steel-blue)] text-white rounded-full hover:bg-[var(--accent-steel-blue)] disabled:opacity-50 disabled:cursor-not-allowed transition-all border border-[var(--accent-steel-blue)] shadow-sm"
        >
        <Send size={14} />
        </button>
      </div>
      </div>
    </div>
    );
};

export default FinancialAIAssistant;