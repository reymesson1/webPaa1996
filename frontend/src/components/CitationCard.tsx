import React, { useState } from 'react';
import { Citation } from '../types';
import { Bookmark, ChevronDown, ChevronUp } from 'lucide-react';

interface CitationCardProps {
  citation: Citation;
}

export const CitationCard: React.FC<CitationCardProps> = ({ citation }) => {
  const [expanded, setExpanded] = useState(false);

  const matchPercent = Math.round(citation.similarityScore * 100);

  return (
    <div className="rounded-lg border border-slate-700/70 bg-slate-800/70 overflow-hidden text-xs transition hover:border-slate-600">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full px-2.5 py-1.5 flex items-center justify-between text-left hover:bg-slate-700/50 transition"
      >
        <div className="flex items-center space-x-2">
          <Bookmark className="w-3.5 h-3.5 text-sky-400" />
          <span className="font-semibold text-sky-300">Source Chunk {citation.chunkIndex}</span>
          <span className="text-[10px] px-1.5 py-0.5 rounded bg-sky-500/10 text-sky-400 border border-sky-500/20">
            {matchPercent}% relevance
          </span>
        </div>
        {expanded ? (
          <ChevronUp className="w-3.5 h-3.5 text-slate-400" />
        ) : (
          <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
        )}
      </button>

      {expanded && (
        <div className="p-2.5 bg-slate-900/60 border-t border-slate-700/50 text-slate-300 font-mono text-[11px] leading-relaxed break-words">
          "{citation.snippet}"
        </div>
      )}
    </div>
  );
};
