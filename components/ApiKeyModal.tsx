import React, { useState, useEffect } from 'react';

interface ApiKeyModalProps {
  isOpen: boolean;
  onClose: () => void;
  onKeyChange?: () => void;
}

const ApiKeyModal: React.FC<ApiKeyModalProps> = ({ isOpen, onClose, onKeyChange }) => {
  const [hasKey, setHasKey] = useState(false);
  const [manualKey, setManualKey] = useState('');
  const [showKey, setShowKey] = useState(false);
  const [saveStatus, setSaveStatus] = useState<{ success: boolean; message: string } | null>(null);

  useEffect(() => {
    const checkKey = () => {
      // 로컬 저장소 확인
      const savedKey = localStorage.getItem('gemini_api_key');
      if (savedKey) {
        setManualKey(savedKey);
        setHasKey(true);
      } else {
        setHasKey(false);
      }
    };
    if (isOpen) {
      checkKey();
      setSaveStatus(null);
      setShowKey(false);
    }
  }, [isOpen]);

  const handleSaveManualKey = () => {
    if (manualKey.trim()) {
      localStorage.setItem('gemini_api_key', manualKey.trim());
      setHasKey(true);
      setSaveStatus({ success: true, message: "API 키가 성공적으로 저장 및 적용되었습니다!" });
      if (onKeyChange) onKeyChange();
      
      // 2초 후 메시지 사라짐
      setTimeout(() => setSaveStatus(null), 2000);
    } else {
      localStorage.removeItem('gemini_api_key');
      setHasKey(false);
      alert('API 키를 입력해 주세요.');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden">
        <div className="p-6 border-b border-slate-800 flex justify-between items-center">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <span className="text-2xl">🔑</span> API Key 관리
          </h2>
          <button 
            onClick={onClose}
            className="text-slate-400 hover:text-white transition-colors p-2 hover:bg-slate-800 rounded-full"
          >
            ✕
          </button>
        </div>

        <div className="p-8 space-y-6">
          <div className="bg-slate-800/50 rounded-2xl p-6 border border-slate-700/50 space-y-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-slate-400">API 키 수동 입력</span>
              <span className={`px-3 py-1 rounded-full text-xs font-bold ${hasKey ? 'bg-emerald-500/10 text-emerald-400' : 'bg-amber-500/10 text-amber-400'}`}>
                {hasKey ? '설정됨' : '미설정'}
              </span>
            </div>
            
            <div className="space-y-3">
              <div className="relative">
                <input 
                  type={showKey ? "text" : "password"}
                  id="apiKeyInput"
                  value={manualKey}
                  onChange={(e) => setManualKey(e.target.value)}
                  placeholder="AIzaSy... (API 키 입력)"
                  className="w-full p-4 pr-12 rounded-xl bg-slate-900 border border-slate-700 focus:ring-2 focus:ring-indigo-500 outline-none text-white placeholder-slate-600 transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowKey(!showKey)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors"
                  title={showKey ? "숨기기" : "보기"}
                >
                  {showKey ? (
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path><line x1="1" y1="1" x2="23" y2="23"></line></svg>
                  ) : (
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>
                  )}
                </button>
              </div>
              <button
                onClick={handleSaveManualKey}
                className="w-full bg-indigo-600 hover:bg-indigo-500 text-white py-3 rounded-xl font-bold transition-all shadow-lg shadow-indigo-500/20 active:scale-[0.98]"
              >
                키 저장 및 변경
              </button>
            </div>
            
            {saveStatus && (
              <div className={`p-3 rounded-xl text-xs animate-in fade-in slide-in-from-top-2 duration-300 ${
                saveStatus.success ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
              }`}>
                <div className="flex items-center gap-2">
                  <span>{saveStatus.success ? '✅' : '❌'}</span>
                  <p>{saveStatus.message}</p>
                </div>
              </div>
            )}

            <p className="mt-3 text-[10px] text-slate-500 text-center">
              Gemini API 키는 브라우저의 로컬 저장소에 안전하게 저장됩니다.
            </p>
          </div>
        </div>

        <div className="p-6 bg-slate-950/50 border-t border-slate-800 flex justify-end">
          <button 
            onClick={onClose}
            className="px-6 py-2 rounded-xl text-sm font-medium text-slate-400 hover:text-white hover:bg-slate-800 transition-all"
          >
            닫기
          </button>
        </div>
      </div>
    </div>
  );
};

export default ApiKeyModal;
