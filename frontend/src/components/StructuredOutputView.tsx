import React from 'react';
import { StructuredInsights } from '../types';
import { ConfidenceMeter } from './ConfidenceMeter';
import {
  FileText,
  Tag,
  Shield,
  Smile,
  ListTodo,
  CheckCircle,
  Building,
  User,
  Calendar,
  DollarSign,
  TrendingUp,
  RefreshCw,
} from 'lucide-react';

interface StructuredOutputViewProps {
  insights?: StructuredInsights;
  loading?: boolean;
  onReextract?: () => void;
}

export const StructuredOutputView: React.FC<StructuredOutputViewProps> = ({
  insights,
  loading = false,
  onReextract,
}) => {
  if (loading) {
    return (
      <div className="p-6 rounded-2xl bg-slate-800/40 border border-slate-700/60 animate-pulse space-y-4">
        <div className="h-5 bg-slate-700 rounded w-1/3"></div>
        <div className="h-16 bg-slate-700/60 rounded"></div>
        <div className="grid grid-cols-2 gap-3">
          <div className="h-10 bg-slate-700/60 rounded"></div>
          <div className="h-10 bg-slate-700/60 rounded"></div>
        </div>
        <div className="h-24 bg-slate-700/60 rounded"></div>
      </div>
    );
  }

  if (!insights) {
    return (
      <div className="p-8 rounded-2xl bg-slate-800/30 border border-dashed border-slate-700 text-center">
        <FileText className="w-10 h-10 text-slate-500 mx-auto mb-2" />
        <p className="text-slate-400 text-sm">No structured data extracted yet.</p>
        {onReextract && (
          <button
            onClick={onReextract}
            className="mt-3 inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-sky-600 hover:bg-sky-500 text-white text-xs font-medium transition"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Generate Structured Insights</span>
          </button>
        )}
      </div>
    );
  }

  const getEntityIcon = (type: string) => {
    switch (type) {
      case 'Organization':
        return <Building className="w-3.5 h-3.5 text-blue-400" />;
      case 'Person':
        return <User className="w-3.5 h-3.5 text-emerald-400" />;
      case 'Date':
        return <Calendar className="w-3.5 h-3.5 text-amber-400" />;
      case 'Financial':
        return <DollarSign className="w-3.5 h-3.5 text-green-400" />;
      case 'Metric':
        return <TrendingUp className="w-3.5 h-3.5 text-purple-400" />;
      default:
        return <Tag className="w-3.5 h-3.5 text-slate-400" />;
    }
  };

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case 'High':
        return 'bg-rose-500/10 text-rose-400 border-rose-500/30';
      case 'Medium':
        return 'bg-amber-500/10 text-amber-400 border-amber-500/30';
      case 'Low':
        return 'bg-slate-500/10 text-slate-400 border-slate-500/30';
      default:
        return 'bg-slate-700 text-slate-300';
    }
  };

  return (
    <div className="rounded-2xl bg-slate-800/40 border border-slate-700/60 overflow-hidden shadow-xl">
      {/* Header */}
      <div className="px-5 py-4 border-b border-slate-700/60 flex items-center justify-between bg-slate-800/60">
        <div className="flex items-center space-x-2">
          <FileText className="w-4 h-4 text-sky-400" />
          <h3 className="font-semibold text-sm text-white">AI-Extracted Structured Insights</h3>
        </div>
        {onReextract && (
          <button
            onClick={onReextract}
            title="Re-extract with active model and prompt"
            className="flex items-center space-x-1 text-xs text-slate-400 hover:text-sky-300 bg-slate-700/40 hover:bg-slate-700 px-2.5 py-1 rounded-md transition border border-slate-600/40"
          >
            <RefreshCw className="w-3 h-3" />
            <span>Re-run Extraction</span>
          </button>
        )}
      </div>

      <div className="p-5 space-y-5">
        {/* Executive Summary */}
        <div>
          <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
            Executive Summary
          </h4>
          <p className="text-xs sm:text-sm text-slate-200 leading-relaxed bg-slate-900/60 p-3.5 rounded-xl border border-slate-700/50">
            {insights.summary}
          </p>
        </div>

        {/* Classification Cards */}
        <div>
          <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
            Classification & Attributes
          </h4>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            <div className="p-2.5 rounded-xl bg-slate-900/40 border border-slate-700/40">
              <span className="text-[10px] text-slate-400 block mb-0.5">Category</span>
              <span className="text-xs font-semibold text-sky-400 flex items-center space-x-1">
                <Tag className="w-3 h-3 inline" />
                <span>{insights.classification.category}</span>
              </span>
            </div>

            <div className="p-2.5 rounded-xl bg-slate-900/40 border border-slate-700/40">
              <span className="text-[10px] text-slate-400 block mb-0.5">Primary Topic</span>
              <span className="text-xs font-semibold text-slate-200 truncate block" title={insights.classification.primaryTopic}>
                {insights.classification.primaryTopic}
              </span>
            </div>

            <div className="p-2.5 rounded-xl bg-slate-900/40 border border-slate-700/40">
              <span className="text-[10px] text-slate-400 block mb-0.5">Confidentiality</span>
              <span className="text-xs font-semibold text-amber-400 flex items-center space-x-1">
                <Shield className="w-3 h-3 inline" />
                <span>{insights.classification.confidentialityLevel}</span>
              </span>
            </div>

            <div className="p-2.5 rounded-xl bg-slate-900/40 border border-slate-700/40">
              <span className="text-[10px] text-slate-400 block mb-0.5">Sentiment</span>
              <span className="text-xs font-semibold text-emerald-400 flex items-center space-x-1">
                <Smile className="w-3 h-3 inline" />
                <span>{insights.classification.sentiment}</span>
              </span>
            </div>
          </div>
        </div>

        {/* Key Entities */}
        {insights.keyEntities && insights.keyEntities.length > 0 && (
          <div>
            <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
              Extracted Entities
            </h4>
            <div className="flex flex-wrap gap-2">
              {insights.keyEntities.map((entity, idx) => (
                <div
                  key={idx}
                  className="flex items-center space-x-1.5 px-2.5 py-1 rounded-lg bg-slate-900/60 border border-slate-700/60 text-xs"
                >
                  {getEntityIcon(entity.type)}
                  <span className="font-medium text-slate-200">{entity.name}</span>
                  <span className="text-[10px] text-slate-400 bg-slate-800 px-1 py-0.5 rounded">
                    {entity.type}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Action Items */}
        {insights.actionItems && insights.actionItems.length > 0 && (
          <div>
            <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2 flex items-center space-x-1.5">
              <ListTodo className="w-3.5 h-3.5 text-indigo-400" />
              <span>Action Items & Next Steps</span>
            </h4>
            <div className="space-y-2">
              {insights.actionItems.map((item, idx) => (
                <div
                  key={idx}
                  className="p-2.5 rounded-xl bg-slate-900/50 border border-slate-700/40 flex items-start justify-between space-x-3 text-xs"
                >
                  <div className="flex items-start space-x-2">
                    <CheckCircle className="w-3.5 h-3.5 text-sky-400 shrink-0 mt-0.5" />
                    <div>
                      <span className="text-slate-200">{item.task}</span>
                      {item.assignee && (
                        <span className="text-[11px] text-slate-400 block mt-0.5">
                          Assignee: <span className="text-slate-300 font-medium">{item.assignee}</span>
                        </span>
                      )}
                    </div>
                  </div>
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold border ${getPriorityBadge(item.priority)}`}>
                    {item.priority}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Confidence Meter */}
        <div className="pt-2 border-t border-slate-700/40">
          <ConfidenceMeter score={insights.confidenceScore} />
        </div>
      </div>
    </div>
  );
};
