import React, { useState, useEffect } from 'react';
import { Document, ChatMessage } from '../types';
import { api } from '../services/api';
import { StructuredOutputView } from '../components/StructuredOutputView';
import { ChatInterface } from '../components/ChatInterface';
import {
  ArrowLeft,
  FileText,
  Layers,
  Sparkles,
  BookOpen,
  Calendar,
  Zap,
  CheckCircle,
  Copy,
} from 'lucide-react';

interface DocumentDetailPageProps {
  document: Document;
  onBack: () => void;
  selectedProvider: string;
  selectedPromptVersion: string;
}

export const DocumentDetailPage: React.FC<DocumentDetailPageProps> = ({
  document: initialDoc,
  onBack,
  selectedProvider,
  selectedPromptVersion,
}) => {
  const [doc, setDoc] = useState<Document>(initialDoc);
  const [activeTab, setActiveTab] = useState<'insights' | 'raw_text'>('insights');
  const [reextracting, setReextracting] = useState(false);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    // Load existing session history
    const loadSession = async () => {
      try {
        const res = await api.getSession(doc.id);
        if (res.session && res.session.messages) {
          setChatMessages(res.session.messages);
        }
      } catch (err) {
        console.warn('Failed to load session messages', err);
      }
    };
    loadSession();
  }, [doc.id]);

  const handleReextract = async () => {
    try {
      setReextracting(true);
      const res = await api.reextractInsights(doc.id, selectedPromptVersion, selectedProvider);
      setDoc(res.document);
    } catch (err) {
      console.error('Re-extraction failed', err);
    } finally {
      setReextracting(false);
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(doc.sanitizedContent);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      {/* Top Breadcrumb & Document Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div className="flex items-center space-x-3">
          <button
            onClick={onBack}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 transition"
            title="Back to all documents"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <div className="flex items-center space-x-2">
              <h1 className="text-lg font-bold text-white tracking-tight">{doc.title}</h1>
              <span className="text-xs px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 font-mono border border-slate-700">
                {doc.id}
              </span>
            </div>
            <div className="flex items-center space-x-4 text-xs text-slate-400 mt-1">
              <span className="flex items-center space-x-1">
                <Calendar className="w-3.5 h-3.5" />
                <span>{new Date(doc.createdAt).toLocaleDateString()}</span>
              </span>
              <span className="flex items-center space-x-1">
                <Layers className="w-3.5 h-3.5" />
                <span>{doc.chunksCount} RAG Chunks</span>
              </span>
              <span className="flex items-center space-x-1">
                <Zap className="w-3.5 h-3.5 text-amber-400" />
                <span>~{doc.estimatedTokens} tokens</span>
              </span>
            </div>
          </div>
        </div>

        {/* View Tabs Toggle */}
        <div className="flex items-center space-x-1 bg-slate-800/80 p-1 rounded-xl border border-slate-700 self-start sm:self-auto">
          <button
            onClick={() => setActiveTab('insights')}
            className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition ${
              activeTab === 'insights'
                ? 'bg-sky-600 text-white shadow'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Structured Insights</span>
          </button>
          <button
            onClick={() => setActiveTab('raw_text')}
            className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition ${
              activeTab === 'raw_text'
                ? 'bg-sky-600 text-white shadow'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <BookOpen className="w-3.5 h-3.5" />
            <span>Source Text</span>
          </button>
        </div>
      </div>

      {/* Main Two-Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Structured Insights or Raw Text (7 columns) */}
        <div className="lg:col-span-7 space-y-6">
          {activeTab === 'insights' ? (
            <StructuredOutputView
              insights={doc.structuredInsights}
              loading={reextracting}
              onReextract={handleReextract}
            />
          ) : (
            <div className="rounded-2xl bg-slate-800/40 border border-slate-700/60 overflow-hidden shadow-xl">
              <div className="px-5 py-3.5 border-b border-slate-700/60 bg-slate-800/60 flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <FileText className="w-4 h-4 text-sky-400" />
                  <span className="font-semibold text-xs text-white uppercase tracking-wider">
                    Sanitized Primary Text
                  </span>
                </div>
                <button
                  onClick={copyToClipboard}
                  className="flex items-center space-x-1 text-xs text-slate-400 hover:text-white transition bg-slate-700/50 px-2 py-1 rounded"
                >
                  {copied ? (
                    <>
                      <CheckCircle className="w-3 h-3 text-emerald-400" />
                      <span className="text-emerald-400">Copied!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3 h-3" />
                      <span>Copy</span>
                    </>
                  )}
                </button>
              </div>
              <div className="p-5 max-h-[660px] overflow-y-auto text-xs text-slate-300 font-mono leading-relaxed whitespace-pre-wrap bg-slate-950/50">
                {doc.sanitizedContent}
              </div>
            </div>
          )}
        </div>

        {/* Right Column: AI Assistant Chat Interface (5 columns) */}
        <div className="lg:col-span-5">
          <ChatInterface
            documentId={doc.id}
            documentTitle={doc.title}
            initialMessages={chatMessages}
            selectedPromptVersion={selectedPromptVersion}
            selectedProvider={selectedProvider}
          />
        </div>
      </div>
    </div>
  );
};
