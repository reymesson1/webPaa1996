import React, { useState, useRef, useEffect } from 'react';
import { ChatMessage, Citation } from '../types';
import { ModelStatusBadge, ModelLifecycleState } from './ModelStatusBadge';
import { ConfidenceMeter } from './ConfidenceMeter';
import { CitationCard } from './CitationCard';
import { SSEStreamClient } from '../services/sseStream';
import { api } from '../services/api';
import {
  Send,
  Sparkles,
  RotateCcw,
  ThumbsUp,
  ThumbsDown,
  Bot,
  User,
  Clock,
  Zap,
  HelpCircle,
  StopCircle,
} from 'lucide-react';

interface ChatInterfaceProps {
  documentId: string;
  documentTitle: string;
  initialMessages?: ChatMessage[];
  selectedPromptVersion: string;
  selectedProvider: string;
}

export const ChatInterface: React.FC<ChatInterfaceProps> = ({
  documentId,
  documentTitle,
  initialMessages = [],
  selectedPromptVersion,
  selectedProvider,
}) => {
  const [messages, setMessages] = useState<ChatMessage[]>(initialMessages);
  const [inputQuery, setInputQuery] = useState('');
  const [modelStatus, setModelStatus] = useState<ModelLifecycleState>('idle');
  const [statusMessage, setStatusMessage] = useState<string>('');
  const [isStreaming, setIsStreaming] = useState(false);
  const [feedbackGiven, setFeedbackGiven] = useState<Record<string, 'thumbs_up' | 'thumbs_down'>>({});
  const abortControllerRef = useRef<AbortController | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMessages(initialMessages);
  }, [initialMessages]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, modelStatus]);

  const handleSend = async (queryToSend?: string) => {
    const text = (queryToSend || inputQuery).trim();
    if (!text || isStreaming) return;

    setInputQuery('');
    setModelStatus('retrieving_chunks');
    setStatusMessage('Searching vector store for grounded document chunks...');
    setIsStreaming(true);

    const userMessage: ChatMessage = {
      id: `usr_${Date.now()}`,
      sessionId: 'active',
      role: 'user',
      content: text,
      createdAt: new Date().toISOString(),
    };

    const assistantPlaceholderId = `asst_${Date.now()}`;
    const assistantPlaceholder: ChatMessage = {
      id: assistantPlaceholderId,
      sessionId: 'active',
      role: 'assistant',
      content: '',
      createdAt: new Date().toISOString(),
      isStreaming: true,
      promptVersion: selectedPromptVersion,
      model: selectedProvider,
    };

    setMessages((prev) => [...prev, userMessage, assistantPlaceholder]);

    abortControllerRef.current = new AbortController();

    // Prepare previous history (up to last 6 messages)
    const historyPayload = messages.slice(-6).map((m) => ({
      role: m.role as 'user' | 'assistant',
      content: m.content,
    }));

    let accumulatedContent = '';

    await SSEStreamClient.streamChat(
      {
        documentId,
        question: text,
        promptVersion: selectedPromptVersion,
        provider: selectedProvider,
        history: historyPayload,
      },
      {
        onStatus: (status, msg) => {
          if (status === 'retrieving_chunks') {
            setModelStatus('retrieving_chunks');
            setStatusMessage(msg || 'Retrieving vector context...');
          } else {
            setModelStatus('thinking');
            setStatusMessage(msg || 'Formulating grounded response...');
          }
        },
        onToken: (token) => {
          setModelStatus('streaming');
          accumulatedContent += token;

          setMessages((prev) =>
            prev.map((msg) =>
              msg.id === assistantPlaceholderId
                ? { ...msg, content: accumulatedContent }
                : msg
            )
          );
        },
        onDone: (data) => {
          setModelStatus('done');
          setIsStreaming(false);

          setMessages((prev) =>
            prev.map((msg) =>
              msg.id === assistantPlaceholderId
                ? {
                    ...msg,
                    id: data.message?.id || assistantPlaceholderId,
                    content: data.message?.content || accumulatedContent,
                    citations: data.citations,
                    confidenceScore: data.confidenceScore,
                    tokensUsed: data.tokensUsed,
                    latencyMs: data.latencyMs,
                    isStreaming: false,
                  }
                : msg
            )
          );

          setTimeout(() => setModelStatus('idle'), 3000);
        },
        onError: (err) => {
          setModelStatus('error');
          setStatusMessage(err);
          setIsStreaming(false);

          setMessages((prev) =>
            prev.map((msg) =>
              msg.id === assistantPlaceholderId
                ? {
                    ...msg,
                    content: `⚠️ Error during AI inference: ${err}. Please retry or switch providers.`,
                    isStreaming: false,
                  }
                : msg
            )
          );
        },
      },
      abortControllerRef.current.signal
    );
  };

  const handleStopStream = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      setIsStreaming(false);
      setModelStatus('idle');
    }
  };

  const handleRefine = (content: string) => {
    setInputQuery(content);
  };

  const handleFeedback = async (messageId: string, type: 'thumbs_up' | 'thumbs_down') => {
    try {
      setFeedbackGiven((prev) => ({ ...prev, [messageId]: type }));
      await api.submitFeedback(messageId, type);
    } catch (err) {
      console.error('Failed to submit feedback', err);
    }
  };

  const samplePrompts = [
    'What are the core objectives and deliverables?',
    'Identify all potential risks or constraints.',
    'Summarize the primary responsibilities and deadlines.',
    'Are there any financial, budget, or SLA commitments?',
  ];

  return (
    <div className="flex flex-col h-[750px] rounded-2xl bg-slate-800/40 border border-slate-700/60 overflow-hidden shadow-2xl">
      {/* Chat Header */}
      <div className="px-5 py-3.5 border-b border-slate-700/60 bg-slate-800/60 flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <div className="w-7 h-7 rounded-lg bg-sky-500/20 text-sky-400 flex items-center justify-center border border-sky-500/30">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <h3 className="font-semibold text-sm text-white flex items-center space-x-2">
              <span>Interactive Document Assistant</span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-700 text-slate-300 font-mono">
                {selectedPromptVersion}
              </span>
            </h3>
            <p className="text-[11px] text-slate-400">RAG Grounded Q&A with Vector Attribution</p>
          </div>
        </div>

        <div>
          <ModelStatusBadge status={modelStatus} customMessage={statusMessage} />
        </div>
      </div>

      {/* Messages Scroll Area */}
      <div className="flex-1 overflow-y-auto p-5 space-y-5">
        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center px-4">
            <div className="w-12 h-12 rounded-2xl bg-sky-500/10 text-sky-400 flex items-center justify-center mb-3 border border-sky-500/20">
              <Bot className="w-6 h-6" />
            </div>
            <h4 className="text-sm font-semibold text-white mb-1">
              Ask anything about "{documentTitle}"
            </h4>
            <p className="text-xs text-slate-400 max-w-sm mb-6">
              Our AI analyzes your document chunks in real time, citing exact source passages and verifying facts.
            </p>

            <div className="w-full max-w-md space-y-2">
              <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider text-left">
                Suggested Prompts
              </div>
              <div className="grid grid-cols-1 gap-2">
                {samplePrompts.map((prompt, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleSend(prompt)}
                    className="p-2.5 text-left text-xs bg-slate-900/60 hover:bg-slate-800 text-slate-300 hover:text-white rounded-xl border border-slate-700/60 hover:border-sky-500/50 transition flex items-center justify-between group"
                  >
                    <span>{prompt}</span>
                    <Send className="w-3 h-3 text-slate-500 group-hover:text-sky-400 shrink-0 ml-2" />
                  </button>
                ))}
              </div>
            </div>
          </div>
        ) : (
          messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}
            >
              {/* Message Bubble */}
              <div
                className={`max-w-[85%] rounded-2xl p-4 shadow-md ${
                  msg.role === 'user'
                    ? 'bg-sky-600 text-white rounded-br-sm'
                    : 'bg-slate-900/90 text-slate-200 border border-slate-700/70 rounded-bl-sm'
                }`}
              >
                {/* Header inside Bubble */}
                <div className="flex items-center space-x-1.5 mb-2 opacity-80 text-[11px]">
                  {msg.role === 'user' ? (
                    <>
                      <User className="w-3.5 h-3.5" />
                      <span>You</span>
                    </>
                  ) : (
                    <>
                      <Bot className="w-3.5 h-3.5 text-sky-400" />
                      <span>DocIntel Assistant</span>
                      {msg.model && (
                        <span className="text-[10px] px-1.5 py-0.2 bg-slate-800 rounded font-mono text-slate-300">
                          {msg.model}
                        </span>
                      )}
                    </>
                  )}
                </div>

                {/* Content */}
                <div className="text-xs sm:text-sm whitespace-pre-wrap leading-relaxed">
                  {msg.content || (msg.isStreaming ? '▋' : '')}
                </div>

                {/* Assistant Metadata: Citations, Confidence, Tokens, Latency */}
                {msg.role === 'assistant' && !msg.isStreaming && (
                  <div className="mt-3 pt-3 border-t border-slate-800 space-y-2.5">
                    {/* Confidence Meter */}
                    {msg.confidenceScore !== undefined && (
                      <ConfidenceMeter
                        score={msg.confidenceScore}
                        isUncertain={msg.confidenceScore < 0.5}
                      />
                    )}

                    {/* Citations List */}
                    {msg.citations && msg.citations.length > 0 && (
                      <div>
                        <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
                          Referenced Source Excerpts
                        </div>
                        <div className="space-y-1.5">
                          {msg.citations.map((c, i) => (
                            <CitationCard key={i} citation={c} />
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Telemetry Footnote */}
                    <div className="flex items-center justify-between text-[10px] text-slate-400 pt-1">
                      <div className="flex items-center space-x-3">
                        {msg.latencyMs && (
                          <span className="flex items-center space-x-1">
                            <Clock className="w-3 h-3 text-slate-500" />
                            <span>{msg.latencyMs}ms</span>
                          </span>
                        )}
                        {msg.tokensUsed && (
                          <span className="flex items-center space-x-1">
                            <Zap className="w-3 h-3 text-amber-400/80" />
                            <span>{msg.tokensUsed.totalTokens} tokens</span>
                          </span>
                        )}
                      </div>

                      {/* Feedback buttons */}
                      <div className="flex items-center space-x-1">
                        <button
                          onClick={() => handleFeedback(msg.id, 'thumbs_up')}
                          title="Accurate and grounded"
                          className={`p-1 rounded transition ${
                            feedbackGiven[msg.id] === 'thumbs_up'
                              ? 'text-emerald-400 bg-emerald-500/10'
                              : 'text-slate-500 hover:text-slate-300'
                          }`}
                        >
                          <ThumbsUp className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleFeedback(msg.id, 'thumbs_down')}
                          title="Inaccurate or hallucinated"
                          className={`p-1 rounded transition ${
                            feedbackGiven[msg.id] === 'thumbs_down'
                              ? 'text-rose-400 bg-rose-500/10'
                              : 'text-slate-500 hover:text-slate-300'
                          }`}
                        >
                          <ThumbsDown className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Refine / Re-ask button for user messages */}
              {msg.role === 'user' && (
                <button
                  onClick={() => handleRefine(msg.content)}
                  className="mt-1 mr-1 flex items-center space-x-1 text-[11px] text-slate-500 hover:text-sky-400 transition"
                  title="Edit or re-ask this question"
                >
                  <RotateCcw className="w-3 h-3" />
                  <span>Refine / Re-ask</span>
                </button>
              )}
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="p-4 bg-slate-900/80 border-t border-slate-700/60">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSend();
          }}
          className="flex items-center space-x-2"
        >
          <input
            type="text"
            value={inputQuery}
            onChange={(e) => setInputQuery(e.target.value)}
            placeholder="Ask a question about this document..."
            disabled={isStreaming}
            className="flex-1 bg-slate-800/90 text-white text-xs sm:text-sm px-4 py-3 rounded-xl border border-slate-700 focus:outline-none focus:border-sky-500 placeholder-slate-500 transition disabled:opacity-50"
          />

          {isStreaming ? (
            <button
              type="button"
              onClick={handleStopStream}
              className="p-3 rounded-xl bg-rose-600 hover:bg-rose-500 text-white transition shadow-lg shadow-rose-600/20"
              title="Stop generation"
            >
              <StopCircle className="w-4 h-4" />
            </button>
          ) : (
            <button
              type="submit"
              disabled={!inputQuery.trim()}
              className="p-3 rounded-xl bg-sky-600 hover:bg-sky-500 disabled:opacity-40 text-white transition shadow-lg shadow-sky-600/20"
              title="Send question"
            >
              <Send className="w-4 h-4" />
            </button>
          )}
        </form>
      </div>
    </div>
  );
};
