import React from 'react';
import { Loader2, CheckCircle2, AlertCircle, Database, Cpu } from 'lucide-react';

export type ModelLifecycleState = 'idle' | 'retrieving_chunks' | 'thinking' | 'streaming' | 'done' | 'error';

interface ModelStatusBadgeProps {
  status: ModelLifecycleState;
  customMessage?: string;
}

export const ModelStatusBadge: React.FC<ModelStatusBadgeProps> = ({ status, customMessage }) => {
  if (status === 'idle') return null;

  switch (status) {
    case 'retrieving_chunks':
      return (
        <div className="inline-flex items-center space-x-2 px-3 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/30 text-indigo-400 text-xs font-medium animate-pulse">
          <Database className="w-3.5 h-3.5 animate-spin" />
          <span>{customMessage || 'Retrieving vector embeddings & context chunks...'}</span>
        </div>
      );

    case 'thinking':
      return (
        <div className="inline-flex items-center space-x-2 px-3 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs font-medium">
          <Cpu className="w-3.5 h-3.5 animate-pulse" />
          <span>{customMessage || 'Reasoning and evaluating constraints...'}</span>
        </div>
      );

    case 'streaming':
      return (
        <div className="inline-flex items-center space-x-2 px-3 py-1.5 rounded-full bg-sky-500/10 border border-sky-500/30 text-sky-400 text-xs font-medium">
          <Loader2 className="w-3.5 h-3.5 animate-spin" />
          <span>Streaming generation in progress...</span>
        </div>
      );

    case 'done':
      return (
        <div className="inline-flex items-center space-x-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-medium">
          <CheckCircle2 className="w-3.5 h-3.5" />
          <span>Generation complete</span>
        </div>
      );

    case 'error':
      return (
        <div className="inline-flex items-center space-x-1.5 px-2.5 py-1 rounded-full bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs font-medium">
          <AlertCircle className="w-3.5 h-3.5" />
          <span>{customMessage || 'Inference error'}</span>
        </div>
      );

    default:
      return null;
  }
};
