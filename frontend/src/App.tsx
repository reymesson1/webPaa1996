import React, { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Navbar } from './components/Navbar';
import { AuthPage } from './pages/AuthPage';
import { DocumentsPage } from './pages/DocumentsPage';
import { DocumentDetailPage } from './pages/DocumentDetailPage';
import { Document } from './types';
import { Loader2 } from 'lucide-react';

const MainApp: React.FC = () => {
  const { user, loading } = useAuth();
  const [selectedDoc, setSelectedDoc] = useState<Document | null>(null);
  const [selectedProvider, setSelectedProvider] = useState<string>('mock');
  const [selectedPromptVersion, setSelectedPromptVersion] = useState<string>('v2');

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center">
        <Loader2 className="w-10 h-10 text-sky-400 animate-spin mb-3" />
        <p className="text-xs text-slate-400 font-mono">Initializing DocIntel AI Studio...</p>
      </div>
    );
  }

  if (!user) {
    return <AuthPage />;
  }

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col selection:bg-sky-500 selection:text-white">
      <Navbar
        currentView={selectedDoc ? 'detail' : 'documents'}
        onNavigateHome={() => setSelectedDoc(null)}
        selectedProvider={selectedProvider}
        selectedPromptVersion={selectedPromptVersion}
        onProviderChange={setSelectedProvider}
        onPromptVersionChange={setSelectedPromptVersion}
      />

      <main className="flex-1">
        {selectedDoc ? (
          <DocumentDetailPage
            document={selectedDoc}
            onBack={() => setSelectedDoc(null)}
            selectedProvider={selectedProvider}
            selectedPromptVersion={selectedPromptVersion}
          />
        ) : (
          <DocumentsPage
            onSelectDocument={(doc) => setSelectedDoc(doc)}
            selectedProvider={selectedProvider}
            selectedPromptVersion={selectedPromptVersion}
          />
        )}
      </main>

      <footer className="border-t border-slate-800/80 py-4 bg-slate-900/60 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>DocIntel AI • Full Stack AI Engineer Production Assessment</span>
          <span>RAG Embeddings • SSE Streaming • Prompt Versioning • PII Guardrails</span>
        </div>
      </footer>
    </div>
  );
};

export const App: React.FC = () => {
  return (
    <AuthProvider>
      <MainApp />
    </AuthProvider>
  );
};

export default App;
