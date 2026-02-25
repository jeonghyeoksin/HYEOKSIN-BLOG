import React, { useState } from 'react';
import Dashboard from './components/Dashboard';
import { ContentWriter } from './components/ContentWriter';
import { ViewState } from './types';

const App: React.FC = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [accessKeyInput, setAccessKeyInput] = useState('');
  const [currentView, setCurrentView] = useState<ViewState>('dashboard');

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (accessKeyInput === '0705') {
      setIsAuthenticated(true);
    } else {
      alert('접근 키가 올바르지 않습니다.');
    }
  };

  const handleApiKeySelect = () => {
    if ((window as any).aistudio) {
      (window as any).aistudio.openSelectKey();
    } else {
      alert("AI Studio 환경에서만 사용할 수 있습니다.");
    }
  };

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

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center font-sans text-slate-50 p-4">
        <div className="w-full max-w-md p-8 bg-slate-900 rounded-3xl shadow-2xl border border-slate-800 text-center animate-fade-in">
           <div className="w-20 h-20 mx-auto mb-6 bg-gradient-to-br from-indigo-600 to-violet-600 rounded-2xl flex items-center justify-center text-4xl shadow-lg shadow-indigo-500/30 transform -rotate-6">
              🤖
           </div>
           <h1 className="text-3xl font-bold mb-3 text-white">혁신 블로그 AI</h1>
           <p className="text-slate-400 mb-8">접근 권한 확인이 필요합니다.</p>
           
           <form onSubmit={handleLogin} className="space-y-4">
              <input 
                type="password"
                value={accessKeyInput}
                onChange={(e) => setAccessKeyInput(e.target.value)}
                placeholder="ACCESS KEY"
                className="w-full p-4 rounded-xl bg-slate-800 border border-slate-700 focus:ring-2 focus:ring-indigo-500 outline-none text-center text-lg shadow-inner text-white placeholder-slate-600 tracking-[0.5em] font-mono transition-all focus:border-indigo-500"
                autoFocus
              />
              <button 
                type="submit"
                className="w-full bg-indigo-600 text-white px-8 py-4 rounded-xl font-bold hover:bg-indigo-500 transition-all shadow-lg hover:shadow-indigo-500/25 active:scale-95"
              >
                시스템 접속
              </button>
           </form>
           <p className="mt-6 text-xs text-slate-600">
             Authorized Personnel Only
           </p>
        </div>
      </div>
    );
  }

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
                onClick={handleApiKeySelect}
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
    </div>
  );
};

export default App;