import React from 'react';
import { ViewState } from '../types';

interface DashboardProps {
  onChangeView: (view: ViewState) => void;
}

const Dashboard: React.FC<DashboardProps> = ({ onChangeView }) => {
  return (
    <div className="animate-fade-in space-y-12 py-10">
      {/* Hero Section */}
      <div className="relative rounded-3xl overflow-hidden bg-slate-900 text-white shadow-2xl border border-slate-800">
        <div className="absolute inset-0 bg-gradient-to-r from-indigo-900/50 to-purple-900/50 opacity-90"></div>
        {/* Abstract Shapes */}
        <div className="absolute top-0 right-0 -mr-20 -mt-20 w-96 h-96 bg-indigo-500 opacity-10 rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 left-0 -ml-20 -mb-20 w-80 h-80 bg-purple-500 opacity-10 rounded-full blur-3xl"></div>
        
        <div className="relative z-10 px-10 py-24 text-center max-w-4xl mx-auto">
          <span className="inline-block py-1 px-3 rounded-full bg-white/5 border border-white/10 backdrop-blur-sm text-indigo-300 text-xs font-bold uppercase tracking-widest mb-6">
            2026 Future Edition
          </span>
          <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight mb-8 leading-tight text-white">
            혁신 블로그 AI
          </h1>
          <p className="text-xl md:text-2xl text-slate-300 mb-12 max-w-2xl mx-auto leading-relaxed font-light">
            혁신 블로그 AI와 혁신적인 포스팅을 실행하세요!
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button 
              onClick={() => onChangeView('studio')}
              className="px-10 py-5 bg-indigo-600 text-white rounded-2xl font-bold text-xl hover:bg-indigo-500 transition-all shadow-xl hover:shadow-2xl hover:-translate-y-1 flex items-center justify-center gap-2"
            >
              새 포스팅 작성하기 ⚡️
            </button>
          </div>
        </div>
      </div>

      {/* Feature Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Card 1 */}
        <div className="bg-slate-800/50 p-8 rounded-2xl shadow-sm border border-slate-700 hover:shadow-xl transition-all duration-300 group cursor-default backdrop-blur-sm hover:bg-slate-800">
          <div className="w-14 h-14 rounded-2xl bg-indigo-900/50 text-indigo-400 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300 border border-indigo-500/20">
             <span className="text-2xl">🚀</span>
          </div>
          <h3 className="text-xl font-bold text-slate-100 mb-3">2026 트렌드 반영</h3>
          <p className="text-slate-400 leading-relaxed">
            단순한 글쓰기가 아닙니다. 2026년의 시점에서 바라본 미래지향적인 인사이트를 담아 독자들을 사로잡으세요.
          </p>
        </div>

        {/* Card 2 */}
        <div className="bg-slate-800/50 p-8 rounded-2xl shadow-sm border border-slate-700 hover:shadow-xl transition-all duration-300 group cursor-default backdrop-blur-sm hover:bg-slate-800">
          <div className="w-14 h-14 rounded-2xl bg-emerald-900/50 text-emerald-400 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300 border border-emerald-500/20">
             <span className="text-2xl">🎨</span>
          </div>
          <h3 className="text-xl font-bold text-slate-100 mb-3">자동화된 비주얼</h3>
          <p className="text-slate-400 leading-relaxed">
            Nanobanana 3.0 엔진이 글의 맥락을 이해하고, 가장 적합한 1:1 썸네일과 인포그래픽을 즉시 생성합니다.
          </p>
        </div>

        {/* Card 3 */}
        <div className="bg-slate-800/50 p-8 rounded-2xl shadow-sm border border-slate-700 hover:shadow-xl transition-all duration-300 group cursor-default backdrop-blur-sm hover:bg-slate-800">
          <div className="w-14 h-14 rounded-2xl bg-purple-900/50 text-purple-400 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300 border border-purple-500/20">
             <span className="text-2xl">⚡️</span>
          </div>
          <h3 className="text-xl font-bold text-slate-100 mb-3">원클릭 워크플로우</h3>
          <p className="text-slate-400 leading-relaxed">
            키워드 선정부터 최종 결과물 다운로드까지. 불필요한 과정은 생략하고 창작의 본질에만 집중하세요.
          </p>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;