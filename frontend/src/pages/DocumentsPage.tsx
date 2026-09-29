import React, { useState, useEffect } from 'react';
import { Document } from '../types';
import { api } from '../services/api';
import { DocumentUpload } from '../components/DocumentUpload';
import {
  FileText,
  Trash2,
  ArrowRight,
  Database,
  Tag,
  Zap,
  Clock,
  Sparkles,
  Smile,
  Loader2,
} from 'lucide-react';

interface DocumentsPageProps {
  onSelectDocument: (doc: Document) => void;
  selectedProvider: string;
  selectedPromptVersion: string;
}

export const DocumentsPage: React.FC<DocumentsPageProps> = ({
  onSelectDocument,
  selectedProvider,
  selectedPromptVersion,
}) => {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const fetchDocuments = async () => {
    try {
      setLoading(true);
      const res = await api.listDocuments();
      setDocuments(res.documents);
    } catch (err) {
      console.error('Failed to fetch documents', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDocuments();
  }, []);

  const handleDocumentCreated = (newDoc: Document) => {
    setDocuments((prev) => [newDoc, ...prev]);
    onSelectDocument(newDoc);
  };

  const handleDelete = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (!confirm('Are you sure you want to delete this document and its vector embeddings?')) {
      return;
    }

    try {
      setDeletingId(id);
      await api.deleteDocument(id);
      setDocuments((prev) => prev.filter((d) => d.id !== id));
    } catch (err) {
      console.error('Delete failed', err);
    } finally {
      setDeletingId(null);
    }
  };

  const totalChunks = documents.reduce((acc, doc) => acc + (doc.chunksCount || 0), 0);
  const totalTokens = documents.reduce((acc, doc) => acc + (doc.estimatedTokens || 0), 0);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Metrics Banner */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 rounded-2xl bg-slate-800/40 border border-slate-700/60 flex items-center space-x-3 shadow-lg">
          <div className="w-10 h-10 rounded-xl bg-sky-500/10 text-sky-400 flex items-center justify-center border border-sky-500/20">
            <FileText className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xl font-bold text-white">{documents.length}</div>
            <div className="text-xs text-slate-400">Indexed Documents</div>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-slate-800/40 border border-slate-700/60 flex items-center space-x-3 shadow-lg">
          <div className="w-10 h-10 rounded-xl bg-indigo-500/10 text-indigo-400 flex items-center justify-center border border-indigo-500/20">
            <Database className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xl font-bold text-white">{totalChunks}</div>
            <div className="text-xs text-slate-400">Vector Embeddings (RAG)</div>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-slate-800/40 border border-slate-700/60 flex items-center space-x-3 shadow-lg">
          <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center border border-amber-500/20">
            <Zap className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xl font-bold text-white">~{totalTokens.toLocaleString()}</div>
            <div className="text-xs text-slate-400">Processed Context Tokens</div>
          </div>
        </div>
      </div>

      {/* Ingestion Section */}
      <DocumentUpload
        onSuccess={handleDocumentCreated}
        selectedProvider={selectedProvider}
        selectedPromptVersion={selectedPromptVersion}
      />

      {/* Documents List */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-bold text-white flex items-center space-x-2">
            <FileText className="w-4 h-4 text-sky-400" />
            <span>Workspace Documents</span>
          </h2>
          <span className="text-xs text-slate-400">
            Click any document to start interactive Q&A or view structured insights
          </span>
        </div>

        {loading ? (
          <div className="p-12 text-center">
            <Loader2 className="w-8 h-8 text-sky-400 animate-spin mx-auto mb-2" />
            <p className="text-xs text-slate-400">Loading documents from vector store...</p>
          </div>
        ) : documents.length === 0 ? (
          <div className="p-12 rounded-2xl bg-slate-800/30 border border-dashed border-slate-700 text-center">
            <FileText className="w-10 h-10 text-slate-500 mx-auto mb-3" />
            <h3 className="text-sm font-semibold text-white mb-1">No documents ingested yet</h3>
            <p className="text-xs text-slate-400 max-w-sm mx-auto mb-4">
              Select one of the sample templates above or paste text to explore RAG Q&A and structured intelligence.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {documents.map((doc) => (
              <div
                key={doc.id}
                onClick={() => onSelectDocument(doc)}
                className="group rounded-2xl bg-slate-800/40 hover:bg-slate-800/70 border border-slate-700/60 hover:border-sky-500/50 p-5 cursor-pointer transition-all duration-200 shadow-lg flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <h3 className="font-semibold text-sm text-white group-hover:text-sky-300 transition line-clamp-2">
                      {doc.title}
                    </h3>
                    <button
                      onClick={(e) => handleDelete(e, doc.id)}
                      disabled={deletingId === doc.id}
                      title="Delete document"
                      className="text-slate-500 hover:text-rose-400 p-1 rounded-md hover:bg-slate-700/50 transition shrink-0"
                    >
                      {deletingId === doc.id ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <Trash2 className="w-3.5 h-3.5" />
                      )}
                    </button>
                  </div>

                  {/* Summary snippet */}
                  <p className="text-xs text-slate-400 line-clamp-3 mb-4 leading-relaxed">
                    {doc.structuredInsights?.summary || doc.sanitizedContent.substring(0, 150) + '...'}
                  </p>
                </div>

                <div className="space-y-3 pt-3 border-t border-slate-700/50 text-xs">
                  {/* Tags */}
                  <div className="flex flex-wrap items-center gap-1.5">
                    {doc.structuredInsights?.classification?.category && (
                      <span className="px-2 py-0.5 rounded-full bg-sky-500/10 text-sky-400 border border-sky-500/20 text-[10px] font-semibold flex items-center space-x-1">
                        <Tag className="w-2.5 h-2.5" />
                        <span>{doc.structuredInsights.classification.category}</span>
                      </span>
                    )}

                    {doc.structuredInsights?.classification?.sentiment && (
                      <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[10px] font-semibold flex items-center space-x-1">
                        <Smile className="w-2.5 h-2.5" />
                        <span>{doc.structuredInsights.classification.sentiment}</span>
                      </span>
                    )}

                    <span className="px-2 py-0.5 rounded-full bg-slate-700 text-slate-300 text-[10px] font-mono">
                      {doc.chunksCount} chunks
                    </span>
                  </div>

                  {/* Footer telemetry & Enter button */}
                  <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1">
                    <span className="flex items-center space-x-1">
                      <Clock className="w-3 h-3" />
                      <span>{new Date(doc.createdAt).toLocaleDateString()}</span>
                    </span>

                    <span className="flex items-center space-x-1 text-sky-400 font-medium group-hover:translate-x-0.5 transition">
                      <span>Open Studio</span>
                      <ArrowRight className="w-3 h-3" />
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
