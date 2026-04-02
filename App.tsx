import React, { useState } from 'react';
import Dashboard from './components/Dashboard';
import { ContentWriter } from './components/ContentWriter';
import Manual from './components/Manual';
import ApiKeyModal from './components/ApiKeyModal';
import { ApiCostGuideModal } from './components/ApiCostGuideModal';
import { ViewState } from './types';
import { useEffect } from 'react';

const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<ViewState>('dashboard');
  const [isApiKeyModalOpen, setIsApiKeyModalOpen] = useState(false);
  const [isCostModalOpen, setIsCostModalOpen] = useState(false);
  const [showInquiryModal, setShowInquiryModal] = useState(false);
  const [apiKeyStatus, setApiKeyStatus] = useState<'unset' | 'set'>('unset');
  const [showSuccessBanner, setShowSuccessBanner] = useState(false);

  const checkApiKey = () => {
    const savedKey = localStorage.getItem('gemini_api_key');
    const newStatus = savedKey ? 'set' : 'unset';
    
    if (apiKeyStatus === 'unset' && newStatus === 'set') {
      setShowSuccessBanner(true);
      setTimeout(() => setShowSuccessBanner(false), 3000);
    }
    
    setApiKeyStatus(newStatus);
  };

  useEffect(() => {
    checkApiKey();
    // Listen for storage changes (in case of multiple tabs, though unlikely here)
    window.addEventListener('storage', checkApiKey);
    return () => window.removeEventListener('storage', checkApiKey);
  }, []);

  const handleModalClose = () => {
    setIsApiKeyModalOpen(false);
    checkApiKey();
  };

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
            <div className="flex items-center gap-2 sm:gap-4">
              {/* API Cost Info Button */}
              <button 
                onClick={() => setIsCostModalOpen(true)}
                className="text-[10px] sm:text-sm font-bold transition-all px-2 sm:px-3 py-1.5 sm:py-2 rounded-lg text-indigo-400 hover:text-white hover:bg-indigo-500/10 flex items-center gap-1 sm:gap-2 border border-indigo-500/30 shadow-lg shadow-indigo-500/5 bg-indigo-500/5"
              >
                <span>💰</span> <span className="hidden xs:inline sm:inline">API 비용 안내</span>
              </button>

              <div className="hidden md:flex items-center space-x-4">
                {/* API Status Indicator */}
                <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full border text-xs font-bold transition-all duration-500 ${
                  apiKeyStatus === 'set' 
                    ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400 shadow-[0_0_10px_rgba(16,185,129,0.1)]' 
                    : 'bg-rose-500/10 border-rose-500/30 text-rose-400 animate-pulse shadow-[0_0_15px_rgba(244,63,94,0.2)]'
                }`}>
                  <div className={`w-2 h-2 rounded-full ${apiKeyStatus === 'set' ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.6)]' : 'bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.6)]'}`} />
                  {apiKeyStatus === 'set' ? 'AI 서비스 정상 작동 중' : 'AI 서비스 중단 (API Key 미설정)'}
                </div>

                <div className="h-4 w-[1px] bg-slate-800 mx-2" />

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
        </div>
      </nav>

      <main className={`flex-1 relative ${currentView === 'studio' ? 'overflow-hidden' : 'overflow-y-auto'}`}>
         {/* API Key Success Banner */}
         {showSuccessBanner && (
           <div className="bg-emerald-600 text-white py-2 px-4 flex items-center justify-center gap-3 sticky top-0 z-40 shadow-lg shadow-emerald-900/20 animate-in slide-in-from-top duration-500">
             <span className="text-lg">✅</span>
             <span className="text-sm font-bold">API Key가 정상적으로 적용되었습니다. 이제 모든 AI 기능을 사용할 수 있습니다!</span>
           </div>
         )}

         {/* API Key Warning Banner */}
         {apiKeyStatus === 'unset' && (
           <div className="bg-rose-600 text-white py-2 px-4 flex items-center justify-center gap-3 animate-pulse sticky top-0 z-40 shadow-lg shadow-rose-900/20">
             <span className="text-lg">⚠️</span>
             <span className="text-sm font-bold">API 미적용시 혁신 블로그AI를 사용할 수 없습니다. API키를 등록해주세요.</span>
             <button 
               onClick={() => setIsApiKeyModalOpen(true)}
               className="ml-4 bg-white text-rose-600 px-3 py-1 rounded-lg text-xs font-black hover:bg-slate-100 transition-colors"
             >
               지금 설정하기
             </button>
           </div>
         )}

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
        onClose={handleModalClose} 
        onKeyChange={checkApiKey}
      />

      <ApiCostGuideModal 
        isOpen={isCostModalOpen} 
        onClose={() => setIsCostModalOpen(false)} 
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

      {/* Developer Credit */}
      <div className="fixed bottom-6 left-6 z-40">
        <div className="bg-slate-900/50 backdrop-blur-sm border border-slate-800 px-4 py-2 rounded-full text-slate-400 text-xs font-medium">
          개발자 : 정혁신
        </div>
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