import React, { useState } from 'react';
import Dashboard from './components/Dashboard';
import { ContentWriter } from './components/ContentWriter';
import ApiKeyModal from './components/ApiKeyModal';
import { ViewState } from './types';

const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<ViewState>('dashboard');
  const [isApiKeyModalOpen, setIsApiKeyModalOpen] = useState(false);

  const renderView = () => {
    switch (currentView) {
      case 'dashboard':
        return <Dashboard onChangeView={setCurrentView} />;
      case 'studio':
        return <ContentWriter />;
      default:
        return <Dashboard onChangeView={setCurrentView} />;
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col font-sans text-slate-50 selection:bg-indigo-500 selection:text-white animate-fade-in">
      {/* Top Navigation */}
      <nav className="h-16 bg-slate-900/80 backdrop-blur-md border-b border-slate-800 z-50 flex-none sticky top-0">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-full">
          <div className="flex justify-between items-center h-full">
            {/* Logo */}
            <div className="flex items-center gap-2 cursor-pointer group" onClick={() => setCurrentView('dashboard')}>
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-600 to-violet-600 flex items-center justify-center text-white font-bold shadow-md shadow-indigo-500/20 group-hover:scale-105 transition-transform text-xl">
                🤖
              </div>
              <span className="text-xl font-bold text-white">
                혁신 블로그 AI
              </span>
            </div>

            {/* Nav Items */}
            <div className="hidden md:flex items-center space-x-8">
              <button 
                onClick={() => setCurrentView('dashboard')}
                className={`text-sm font-medium transition-colors px-3 py-2 rounded-lg ${currentView === 'dashboard' ? 'text-indigo-400 bg-indigo-500/10' : 'text-slate-400 hover:text-white hover:bg-slate-800'}`}
              >
                홈
              </button>
              <button 
                 onClick={() => setCurrentView('studio')}
                 className={`text-sm font-medium transition-colors px-3 py-2 rounded-lg ${currentView === 'studio' ? 'text-indigo-400 bg-indigo-500/10' : 'text-slate-400 hover:text-white hover:bg-slate-800'}`}
              >
                블로그 올인원
              </button>
              <button 
                onClick={() => setIsApiKeyModalOpen(true)}
                className="text-sm font-medium transition-colors px-3 py-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 flex items-center gap-2 border border-slate-700/50"
              >
                <span>🔑</span> API Key 설정
              </button>
            </div>
          </div>
        </div>
      </nav>

      <main className={`flex-1 relative ${currentView === 'studio' ? 'overflow-hidden' : 'overflow-y-auto'}`}>
         {/* If studio, full bleed. If dashboard, centered container. */}
         {currentView === 'studio' ? (
             renderView()
         ) : (
             <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                 {renderView()}
             </div>
         )}
      </main>

      <ApiKeyModal 
        isOpen={isApiKeyModalOpen} 
        onClose={() => setIsApiKeyModalOpen(false)} 
      />
    </div>
  );
};

export default App;