import React from 'react';
import { X, CircleDollarSign, AlertCircle, CheckCircle2, Info, ExternalLink } from 'lucide-react';

interface ApiCostGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ApiCostGuideModal: React.FC<ApiCostGuideModalProps> = ({ isOpen, onClose }) => {
  return (
    <>
      {/* Backdrop */}
      <div 
        className={`fixed inset-0 z-[110] bg-black/60 backdrop-blur-sm transition-opacity duration-300 ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
        onClick={onClose}
      />
      
      {/* Sidebar Panel */}
      <div 
        className={`fixed inset-y-0 right-0 z-[120] bg-slate-900 border-l border-slate-700 shadow-2xl w-full max-w-md h-full overflow-hidden flex flex-col transition-transform duration-300 ease-in-out ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}
      >
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b border-slate-800 bg-slate-900/50 shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-indigo-500/20 rounded-lg">
              <CircleDollarSign className="w-5 h-5 text-indigo-400" />
            </div>
            <h2 className="text-lg font-bold text-white">API 비용 상세 안내</h2>
          </div>
          <button 
            onClick={onClose}
            className="text-slate-400 hover:text-white p-2 hover:bg-slate-800 rounded-lg transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>
        
        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-8 custom-scrollbar pb-24">
          
          {/* Critical Warning */}
          <div className="p-4 bg-rose-950/30 border border-rose-500/30 rounded-xl space-y-3">
            <div className="flex items-center gap-2 text-rose-400 font-bold">
              <AlertCircle className="w-5 h-5" />
              <span>필독 주의사항</span>
            </div>
            <div className="text-sm text-slate-300 leading-relaxed space-y-2">
              <p>
                • 하단의 <strong>사용방법을 반드시 숙지</strong>하신 후 이용하시길 권장드립니다.
              </p>
              <p>
                • API 비용은 <strong>재시도 및 생성 실패 시에도 추가로 과금</strong>될 수 있습니다. 
              </p>
              <p className="text-rose-300/90 bg-rose-500/10 p-2 rounded-lg border border-rose-500/10">
                해당 부분은 혁신AI의 오류가 아닌 <strong>구글 서버의 일시적 불안정 문제</strong>이므로, 실패 시 즉시 재시도하기보다 잠시 뒤 다시 시도하시길 권장드립니다.
              </p>
            </div>
          </div>

          {/* Text Generation Cost */}
          <div className="space-y-4">
            <h3 className="text-white font-bold flex items-center gap-2 text-base">
              <span className="text-blue-400">📝</span> 텍스트 생성 (Gemini 3 Flash)
            </h3>
            <div className="bg-slate-800/40 rounded-xl p-4 border border-slate-700/50 space-y-3">
              <div className="flex justify-between items-center text-sm">
                <span className="text-slate-400">입력 (프롬프트/참고자료)</span>
                <span className="text-emerald-400 font-mono">약 0.1원 / 1k 토큰</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-slate-400">출력 (생성된 원고)</span>
                <span className="text-emerald-400 font-mono">약 0.4원 / 1k 토큰</span>
              </div>
              <p className="text-[11px] text-slate-500 leading-relaxed">
                * 1,000 토큰은 한글 기준 약 400~600자 내외입니다. 참고자료(URL/텍스트)가 길수록 입력 비용이 상승합니다.
              </p>
            </div>
          </div>

          {/* Image Generation Cost */}
          <div className="space-y-4">
            <h3 className="text-white font-bold flex items-center gap-2 text-base">
              <span className="text-purple-400">🎨</span> 이미지 모델별 비용 (1장당)
            </h3>
            <div className="grid grid-cols-1 gap-3">
              <div className="bg-slate-800/40 p-4 rounded-xl border border-slate-700/50 flex justify-between items-center">
                <div>
                  <p className="text-sm font-bold text-slate-200">Gemini 2.5 Flash Image</p>
                  <p className="text-[11px] text-slate-500">가장 빠르고 경제적인 표준 모델</p>
                </div>
                <span className="text-indigo-400 font-mono font-bold">약 28원</span>
              </div>
              <div className="bg-slate-800/40 p-4 rounded-xl border border-slate-700/50 flex justify-between items-center">
                <div>
                  <p className="text-sm font-bold text-slate-200">Gemini 3.1 Flash Image</p>
                  <p className="text-[11px] text-slate-500">한국어 텍스트 렌더링 지원</p>
                </div>
                <span className="text-indigo-400 font-mono font-bold">약 42원</span>
              </div>
              <div className="bg-slate-800/40 p-4 rounded-xl border border-slate-700/50 flex justify-between items-center">
                <div>
                  <p className="text-sm font-bold text-slate-200">Imagen 4.0</p>
                  <p className="text-[11px] text-slate-500">고품질 실사 프리미엄 모델</p>
                </div>
                <span className="text-indigo-400 font-mono font-bold">약 56원</span>
              </div>
            </div>
            <div className="bg-indigo-500/5 border border-indigo-500/20 p-3 rounded-lg flex items-start gap-2">
              <Info className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" />
              <p className="text-[11px] text-indigo-300/80 leading-relaxed">
                본 앱은 비용 절감을 위해 모든 이미지의 기본 해상도를 <strong>512px</strong>로 최적화하여 요청합니다.
              </p>
            </div>
          </div>

          {/* Estimated Total Cost */}
          <div className="space-y-4">
            <h3 className="text-white font-bold flex items-center gap-2 text-base">
              <span className="text-emerald-400">🏆</span> 최종 결과물 예상 비용 (1회 기준)
            </h3>
            <div className="bg-slate-800/60 rounded-2xl p-5 border border-slate-700 space-y-4">
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-slate-400">텍스트 원고 (풀버전)</span>
                  <span className="text-slate-200">약 2원 ~ 5원</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-400">이미지 4장 (Gemini 3.1 기준)</span>
                  <span className="text-slate-200">약 168원</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-400">썸네일 1장 (Gemini 3.1 기준)</span>
                  <span className="text-slate-200">약 42원</span>
                </div>
              </div>
              <div className="pt-4 border-t border-slate-700 flex justify-between items-center">
                <span className="font-bold text-white">총 합계 예상</span>
                <span className="text-xl font-black text-indigo-400 font-mono">약 215원</span>
              </div>
            </div>
          </div>

          {/* Billing Link */}
          <div className="pt-4">
            <a 
              href="https://console.cloud.google.com/billing" 
              target="_blank" 
              rel="noreferrer"
              className="w-full py-3 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-sm font-medium flex items-center justify-center gap-2 transition-colors border border-slate-700"
            >
              <ExternalLink className="w-4 h-4" />
              Google Cloud 실시간 청구서 확인
            </a>
          </div>

        </div>
      </div>
    </>
  );
};
