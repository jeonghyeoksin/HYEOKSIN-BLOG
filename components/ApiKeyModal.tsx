import React, { useState, useEffect } from 'react';
import { testConnection } from '../services/geminiService';

interface ApiKeyModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const ApiKeyModal: React.FC<ApiKeyModalProps> = ({ isOpen, onClose }) => {
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);
  const [hasKey, setHasKey] = useState(false);

  useEffect(() => {
    const checkKey = async () => {
      if ((window as any).aistudio) {
        const selected = await (window as any).aistudio.hasSelectedApiKey();
        setHasKey(selected);
      }
    };
    if (isOpen) {
      checkKey();
      setTestResult(null);
    }
  }, [isOpen]);

  const handleOpenSelectKey = async () => {
    if ((window as any).aistudio) {
      await (window as any).aistudio.openSelectKey();
      // After selecting, we assume success as per guidelines
      setHasKey(true);
      setTestResult(null);
    }
  };

  const handleTestConnection = async () => {
    setIsTesting(true);
    setTestResult(null);
    try {
      const result = await testConnection();
      setTestResult(result);
      if (!result.success && result.message.includes("다시 설정")) {
        setHasKey(false);
      }
    } catch (error) {
      setTestResult({ success: false, message: "테스트 중 오류가 발생했습니다." });
    } finally {
      setIsTesting(false);
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
          <div className="bg-slate-800/50 rounded-2xl p-6 border border-slate-700/50">
            <div className="flex items-center justify-between mb-4">
              <span className="text-sm font-medium text-slate-400">현재 상태</span>
              <span className={`px-3 py-1 rounded-full text-xs font-bold ${hasKey ? 'bg-emerald-500/10 text-emerald-400' : 'bg-amber-500/10 text-amber-400'}`}>
                {hasKey ? '연결됨' : '연결 안 됨'}
              </span>
            </div>
            
            <p className="text-sm text-slate-300 leading-relaxed mb-6">
              Gemini API를 사용하기 위해 유료 Google Cloud 프로젝트의 API 키가 필요합니다. 
              보안을 위해 키는 플랫폼에서 안전하게 관리됩니다.
            </p>

            <button
              onClick={handleOpenSelectKey}
              className="w-full bg-indigo-600 hover:bg-indigo-500 text-white py-3 rounded-xl font-bold transition-all shadow-lg shadow-indigo-500/20 active:scale-[0.98]"
            >
              {hasKey ? 'API Key 변경하기' : 'API Key 설정하기'}
            </button>
            
            <p className="mt-3 text-[10px] text-slate-500 text-center">
              <a href="https://ai.google.dev/gemini-api/docs/billing" target="_blank" rel="noreferrer" className="underline hover:text-slate-400">
                결제 및 요금 안내 확인하기
              </a>
            </p>
          </div>

          <div className="space-y-4">
            <button
              onClick={handleTestConnection}
              disabled={!hasKey || isTesting}
              className={`w-full py-3 rounded-xl font-bold transition-all flex items-center justify-center gap-2 ${
                !hasKey || isTesting 
                  ? 'bg-slate-800 text-slate-500 cursor-not-allowed' 
                  : 'bg-slate-700 hover:bg-slate-600 text-white'
              }`}
            >
              {isTesting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  연결 테스트 중...
                </>
              ) : (
                <><span>⚡</span> 연결 테스트 실행</>
              )}
            </button>

            {testResult && (
              <div className={`p-4 rounded-xl text-sm animate-in fade-in slide-in-from-top-2 duration-300 ${
                testResult.success ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
              }`}>
                <div className="flex gap-3">
                  <span className="text-lg">{testResult.success ? '✅' : '❌'}</span>
                  <p className="leading-snug">{testResult.message}</p>
                </div>
              </div>
            )}
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
