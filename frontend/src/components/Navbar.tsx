import React from 'react';
import { useAuth } from '../context/AuthContext';
import { Brain, Sparkles, LogOut, FileText, ShieldCheck } from 'lucide-react';

interface NavbarProps {
  currentView: 'documents' | 'detail';
  onNavigateHome: () => void;
  selectedProvider?: string;
  selectedPromptVersion?: string;
  onProviderChange?: (provider: string) => void;
  onPromptVersionChange?: (version: string) => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentView,
  onNavigateHome,
  selectedProvider = 'mock',
  selectedPromptVersion = 'v2',
  onProviderChange,
  onPromptVersionChange,
}) => {
  const { user, logout } = useAuth();

  return (
    <header className="border-b border-slate-800 bg-slate-900/90 backdrop-blur sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand */}
        <div className="flex items-center space-x-3 cursor-pointer" onClick={onNavigateHome}>
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-sky-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-sky-500/20">
            <Brain className="w-6 h-6 text-white" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="font-bold text-lg text-white tracking-tight">DocIntel</span>
              <span className="text-xs px-2 py-0.5 rounded-full bg-sky-500/20 text-sky-400 font-semibold border border-sky-500/30">
                AI Studio
              </span>
            </div>
            <p className="text-xs text-slate-400">RAG & Structured Intelligence</p>
          </div>
        </div>

        {/* Navigation & Controls */}
        <div className="flex items-center space-x-4">
          {user && (
            <>
              {currentView === 'detail' && (
                <button
                  onClick={onNavigateHome}
                  className="flex items-center space-x-1.5 text-xs text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 px-3 py-1.5 rounded-lg border border-slate-700 transition"
                >
                  <FileText className="w-3.5 h-3.5" />
                  <span>All Documents</span>
                </button>
              )}

              {/* Provider Selector */}
              {onProviderChange && (
                <div className="flex items-center space-x-1 bg-slate-800/80 border border-slate-700 rounded-lg p-1 text-xs">
                  <Sparkles className="w-3.5 h-3.5 text-amber-400 ml-1.5" />
                  <span className="text-slate-400 text-[11px] hidden sm:inline">Provider:</span>
                  <select
                    value={selectedProvider}
                    onChange={(e) => onProviderChange(e.target.value)}
                    className="bg-transparent text-slate-200 text-xs focus:outline-none cursor-pointer pr-1"
                  >
                    <option value="mock" className="bg-slate-800 text-white">Mock Engine</option>
                    <option value="gemini" className="bg-slate-800 text-white">Google Gemini</option>
                    <option value="openai" className="bg-slate-800 text-white">OpenAI GPT</option>
                  </select>
                </div>
              )}

              {/* Prompt Version Selector */}
              {onPromptVersionChange && (
                <div className="flex items-center space-x-1 bg-slate-800/80 border border-slate-700 rounded-lg p-1 text-xs">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-400 ml-1.5" />
                  <span className="text-slate-400 text-[11px] hidden sm:inline">Prompt:</span>
                  <select
                    value={selectedPromptVersion}
                    onChange={(e) => onPromptVersionChange(e.target.value)}
                    className="bg-transparent text-slate-200 text-xs focus:outline-none cursor-pointer pr-1"
                  >
                    <option value="v2" className="bg-slate-800 text-white">v2 (CoT + Grounding)</option>
                    <option value="v1" className="bg-slate-800 text-white">v1 (Direct QA)</option>
                  </select>
                </div>
              )}

              {/* User Profile & Logout */}
              <div className="flex items-center space-x-3 pl-2 border-l border-slate-800">
                <div className="hidden md:block text-right">
                  <div className="text-xs font-medium text-slate-200">{user.name}</div>
                  <div className="text-[10px] text-slate-400">{user.email}</div>
                </div>
                <button
                  onClick={logout}
                  title="Sign out"
                  className="p-2 text-slate-400 hover:text-rose-400 hover:bg-slate-800 rounded-lg transition"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  );
};
