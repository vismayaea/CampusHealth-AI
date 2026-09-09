import React, { useEffect, useRef, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import { MessageCircle, Send, Bot, X, Loader2, History } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import { chatbotAPI } from '../services/api';

function ChatbotPage() {
  const [isChatActive, setIsChatActive] = useState(false);
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [sessionId, setSessionId] = useState(null);
  const [isSending, setIsSending] = useState(false);
  const [isStarting, setIsStarting] = useState(false);
  const [history, setHistory] = useState([]);
  const [isHistoryLoading, setIsHistoryLoading] = useState(false);
  const [chatError, setChatError] = useState('');
  const { t } = useLanguage();
  const messagesEndRef = useRef(null);

  useEffect(() => {
    loadConversationHistory();
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isSending, isStarting]);

  const normalizeMessage = (msg, index) => ({
    id: msg._id || `${msg.role}-${msg.timestamp || index}`,
    type: msg.role === 'assistant' ? 'bot' : msg.role,
    message: msg.content,
    timestamp: msg.timestamp ? new Date(msg.timestamp) : new Date()
  });

  const loadConversationHistory = async () => {
    try {
      setIsHistoryLoading(true);
      const response = await chatbotAPI.getSessions();
      setHistory(response.data?.sessions || []);
    } catch (error) {
      console.error('Failed to load chat history', error);
      setHistory([]);
    } finally {
      setIsHistoryLoading(false);
    }
  };

  const startChat = async () => {
    setIsChatActive(true);
    setIsStarting(true);
    setChatError('');
    setMessages([]);
    setSessionId(null);

    try {
      const response = await chatbotAPI.startSession({
        context: {}
      });

      const greetingMessage = response.data?.message;
      const newSessionId = response.data?.sessionId;

      if (newSessionId) {
        setSessionId(newSessionId);
      }

      if (greetingMessage) {
        setMessages([
          {
            id: 1,
            type: 'bot',
            message: greetingMessage,
            timestamp: new Date()
          }
        ]);
      } else {
        // Fallback localized greeting
        setMessages([
          {
            id: 1,
            type: 'bot',
            message: t('chatbotGreetingFallback'),
            timestamp: new Date()
          }
        ]);
      }
    } catch (error) {
      console.error('Failed to start chat session', error);
      setChatError(error.response?.data?.message || t('chatbotErrorFallback'));
      setMessages([
        {
          id: Date.now(),
          type: 'bot',
          message: t('chatbotErrorFallback'),
          timestamp: new Date()
        }
      ]);
      setSessionId(null);
    } finally {
      setIsStarting(false);
      loadConversationHistory();
    }
  };

  const openHistorySession = async (id) => {
    try {
      setIsChatActive(true);
      setIsStarting(true);
      setChatError('');
      const response = await chatbotAPI.getSession(id);
      const session = response.data?.session;
      setSessionId(session?.sessionId || id);
      setMessages((session?.messages || []).map(normalizeMessage));
    } catch (error) {
      console.error('Failed to open chat session', error);
      setChatError(error.response?.data?.message || 'Failed to open conversation history.');
    } finally {
      setIsStarting(false);
    }
  };

  const sendMessage = async () => {
    if (!inputMessage.trim()) return;
    const outgoingText = inputMessage.trim();

    const userMessage = {
      id: Date.now(),
      type: 'user',
      message: outgoingText,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setChatError('');

    if (!sessionId) {
      setChatError('Chat session is not ready yet. Please start a new chat.');
      return;
    }

    try {
      setIsSending(true);
      const response = await chatbotAPI.sendMessage({
        sessionId,
        message: outgoingText
      });

      const botText = response.data?.message;

      if (botText) {
        const botMessage = {
          id: Date.now() + 1,
          type: 'bot',
          message: botText,
          timestamp: new Date()
        };
        setMessages(prev => [...prev, botMessage]);
      }
      loadConversationHistory();
    } catch (error) {
      console.error('Failed to send chat message', error);
      const errorMessage = {
        id: Date.now() + 2,
        type: 'bot',
        message: error.response?.data?.message || t('chatbotErrorFallback'),
        timestamp: new Date()
      };
      setChatError(error.response?.data?.message || t('chatbotErrorFallback'));
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsSending(false);
    }
  };

  const endChat = () => {
    if (sessionId) {
      chatbotAPI.endSession({ sessionId }).catch((error) => {
        console.error('Failed to end chat session', error);
      });
    }
    setIsChatActive(false);
    setMessages([]);
    setSessionId(null);
    setChatError('');
    loadConversationHistory();
  };

  const renderMessage = (text) => (
    <ReactMarkdown
      components={{
        p: ({ children }) => <p className="text-base leading-relaxed mb-2 last:mb-0">{children}</p>,
        ul: ({ children }) => <ul className="list-disc pl-5 space-y-1">{children}</ul>,
        ol: ({ children }) => <ol className="list-decimal pl-5 space-y-1">{children}</ol>,
        a: ({ children, href }) => (
          <a href={href} className="underline" target="_blank" rel="noreferrer">
            {children}
          </a>
        ),
        strong: ({ children }) => <strong className="font-semibold">{children}</strong>
      }}
    >
      {text}
    </ReactMarkdown>
  );

  return (
    <div className="space-y-8">
      <div className="flex items-center space-x-4">
        <div className="p-4 bg-primary-100 rounded-xl">
          <MessageCircle className="h-8 w-8 text-primary-600" />
        </div>
        <div>
          <h1 className="text-3xl font-bold text-neutral-900">{t('chatbot')}</h1>
          <p className="text-neutral-600 text-lg">{t('chatbotIntroDescription')}</p>
        </div>
      </div>

      {!isChatActive ? (
        <div className="grid lg:grid-cols-[1fr_320px] gap-6">
          <div className="card">
            <div className="text-center py-16">
              <div className="p-6 bg-primary-100 rounded-full w-20 h-20 mx-auto mb-6">
                <Bot className="h-10 w-10 text-primary-600" />
              </div>
              <h2 className="text-2xl font-semibold text-neutral-900 mb-4">
                {t('chatbotIntroTitle')}
              </h2>
              <p className="text-neutral-600 mb-8 text-lg max-w-2xl mx-auto">
                {t('chatbotIntroBody')}
              </p>
              <button 
                onClick={startChat}
                disabled={isStarting}
                className="btn-primary inline-flex items-center px-8 py-4 text-lg hover:scale-105 transition-transform disabled:opacity-60"
              >
                {isStarting ? (
                  <Loader2 className="mr-3 h-6 w-6 animate-spin" />
                ) : (
                  <MessageCircle className="mr-3 h-6 w-6" />
                )}
                {t('startChat')}
              </button>
            </div>
          </div>

          <div className="card p-6">
            <div className="flex items-center space-x-2 mb-4">
              <History className="h-5 w-5 text-primary-600" />
              <h3 className="font-semibold text-neutral-900">Conversation History</h3>
            </div>
            {isHistoryLoading ? (
              <div className="flex items-center text-neutral-500 text-sm">
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Loading history...
              </div>
            ) : history.length === 0 ? (
              <p className="text-sm text-neutral-500">Start a check-in and your saved conversations will appear here.</p>
            ) : (
              <div className="space-y-3">
                {history.map((item) => (
                  <button
                    key={item.sessionId}
                    onClick={() => openHistorySession(item.sessionId)}
                    className="w-full text-left p-3 rounded-lg border border-neutral-200 hover:border-primary-300 hover:bg-primary-50 transition-colors"
                  >
                    <p className="text-sm font-medium text-neutral-800 line-clamp-2">
                      {item.preview}
                    </p>
                    <p className="text-xs text-neutral-500 mt-1">
                      {new Date(item.lastActivity).toLocaleString()} · {item.messageCount} messages
                    </p>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="card h-[700px] flex flex-col">
          <div className="flex items-center justify-between p-6 border-b border-neutral-200">
            <div className="flex items-center space-x-3">
              <div className="w-4 h-4 bg-success-500 rounded-full"></div>
              <span className="text-lg font-medium text-neutral-700">
                {t('chatbotAssistantLabel')}
              </span>
            </div>
            <button
              onClick={endChat}
              className="p-2 text-neutral-400 hover:text-neutral-600 transition-colors rounded-lg hover:bg-neutral-100"
            >
              <X className="h-6 w-6" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            {chatError && (
              <div className="rounded-lg border border-red-200 bg-red-50 text-red-700 px-4 py-3 text-sm">
                {chatError}
              </div>
            )}
            {isStarting && (
              <div className="flex justify-start">
                <div className="bg-neutral-100 text-neutral-700 px-6 py-4 rounded-xl inline-flex items-center">
                  <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                  Starting chat...
                </div>
              </div>
            )}
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex ${msg.type === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-sm lg:max-w-lg px-6 py-4 rounded-xl ${
                    msg.type === 'user'
                      ? 'bg-primary-600 text-white'
                      : 'bg-neutral-100 text-neutral-800'
                  }`}
                >
                  {msg.type === 'bot' ? renderMessage(msg.message) : (
                    <p className="text-base leading-relaxed">{msg.message}</p>
                  )}
                  <p className="text-xs mt-2 opacity-70">
                    {msg.timestamp.toLocaleTimeString()}
                  </p>
                </div>
              </div>
            ))}
            {isSending && (
              <div className="flex justify-start">
                <div className="bg-neutral-100 text-neutral-800 px-6 py-4 rounded-xl">
                  <div className="flex items-center space-x-2">
                    <span className="w-2 h-2 bg-primary-500 rounded-full animate-bounce"></span>
                    <span className="w-2 h-2 bg-primary-500 rounded-full animate-bounce [animation-delay:120ms]"></span>
                    <span className="w-2 h-2 bg-primary-500 rounded-full animate-bounce [animation-delay:240ms]"></span>
                    <span className="text-sm text-neutral-500 ml-2">Assistant is typing...</span>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          <div className="p-6 border-t border-neutral-200">
            <div className="flex space-x-3">
              <input
                type="text"
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && !isSending && sendMessage()}
                placeholder={t('typeMessage')}
                className="flex-1 form-input text-base py-3"
              />
              <button
                onClick={sendMessage}
                disabled={!inputMessage.trim() || isSending}
                className="btn-primary px-6 py-3 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Send className="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default ChatbotPage;
