import React, { useState } from 'react';
import Dashboard from './components/Dashboard';
import { ContentWriter } from './components/ContentWriter';
import Manual from './components/Manual';
import ApiKeyModal from './components/ApiKeyModal';
import { ViewState } from './types';

const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<ViewState>('dashboard');
  const [isApiKeyModalOpen, setIsApiKeyModalOpen] = useState(false);
  const [showInquiryModal, setShowInquiryModal] = useState(false);

  const renderView = () => {
    switch (currentView) {
      case 'dashboard':
        return <Dashboard onChangeView={setCurrentView} />;
      case 'studio':
        return <ContentWriter />;
      case 'manual':
        return <Manual />;
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
                ✍️
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
                 onClick={() => setCurrentView('manual')}
                 className={`text-sm font-medium transition-colors px-3 py-2 rounded-lg ${currentView === 'manual' ? 'text-indigo-400 bg-indigo-500/10' : 'text-slate-400 hover:text-white hover:bg-slate-800'}`}
              >
                사용방법
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

      {/* Floating Action Buttons */}
      <div className="fixed bottom-6 right-6 flex flex-col gap-3 z-40">
        <button 
          onClick={() => window.open('https://hyeoksinai.com', '_blank')}
          className="bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2.5 rounded-full shadow-lg shadow-indigo-500/20 flex items-center gap-2 text-sm font-medium transition-all hover:scale-105 active:scale-95"
        >
          <span>🚀</span> 혁신AI 플랫폼 바로가기
        </button>
        <button 
          onClick={() => setShowInquiryModal(true)}
          className="bg-slate-800 hover:bg-slate-700 text-slate-200 px-4 py-2.5 rounded-full shadow-lg border border-slate-700 flex items-center gap-2 text-sm font-medium transition-all hover:scale-105 active:scale-95"
        >
          <span>🛠️</span> 오류/유지보수 문의
        </button>
      </div>

      {/* Inquiry Modal */}
      {showInquiryModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8 max-w-md w-full shadow-2xl animate-in zoom-in-95 duration-200">
            <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
              <span>📧</span> 오류/유지보수 문의
            </h3>
            <p className="text-slate-300 leading-relaxed mb-6">
              업데이트나 유지보수가 필요할 경우 아래 이메일로 어떤 부분이 필요한지 상세하게 작성 후 보내주세요.
            </p>
            <div className="bg-slate-800/50 p-4 rounded-xl border border-slate-700 mb-8 text-center">
              <code className="text-indigo-400 font-mono text-lg">info@nextin.ai.kr</code>
            </div>
            <button 
              onClick={() => setShowInquiryModal(false)}
              className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl transition-colors"
            >
              확인
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;