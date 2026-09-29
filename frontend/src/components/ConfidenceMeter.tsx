import React from 'react';
import { AlertTriangle, ShieldCheck, HelpCircle } from 'lucide-react';

interface ConfidenceMeterProps {
  score?: number;
  isUncertain?: boolean;
  uncertaintyReason?: string;
  className?: string;
}

export const ConfidenceMeter: React.FC<ConfidenceMeterProps> = ({
  score = 0.85,
  isUncertain = false,
  uncertaintyReason,
  className = '',
}) => {
  const percentage = Math.round(score * 100);

  let colorClass = 'text-emerald-400 bg-emerald-500';
  let label = 'High Confidence';

  if (isUncertain || score < 0.5) {
    colorClass = 'text-rose-400 bg-rose-500';
    label = 'Low Confidence / Uncertain';
  } else if (score < 0.75) {
    colorClass = 'text-amber-400 bg-amber-500';
    label = 'Moderate Confidence';
  }

  return (
    <div className={`space-y-1.5 ${className}`}>
      <div className="flex items-center justify-between text-xs">
        <span className="flex items-center space-x-1 text-slate-400 font-medium">
          {isUncertain ? (
            <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
          ) : (
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
          )}
          <span>Groundedness Score</span>
        </span>
        <span className={`font-semibold ${colorClass.split(' ')[0]}`}>
          {percentage}% — {label}
        </span>
      </div>

      <div className="w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-500 ${colorClass.split(' ')[1]}`}
          style={{ width: `${Math.max(5, Math.min(100, percentage))}%` }}
        />
      </div>

      {isUncertain && (
        <div className="mt-2 p-2 rounded-lg bg-amber-950/40 border border-amber-500/30 text-amber-200 text-xs flex items-start space-x-2">
          <HelpCircle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
          <div>
            <span className="font-semibold">Potential Uncertainty: </span>
            {uncertaintyReason ||
              'The retrieved document excerpts have weak semantic overlap with this query. Verify independently.'}
          </div>
        </div>
      )}
    </div>
  );
};
