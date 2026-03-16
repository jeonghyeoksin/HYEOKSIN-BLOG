import React from 'react';
import { ViewState } from '../types';

interface DashboardProps {
  onChangeView: (view: ViewState) => void;
}

const Dashboard: React.FC<DashboardProps> = ({ onChangeView }) => {
  return (
    <div className="animate-fade-in space-y-12 py-10">
      {/* Top 16:9 Banner Image */}
      <div className="w-full aspect-video rounded-3xl overflow-hidden shadow-2xl border border-emerald-800/50 relative group bg-emerald-950">
        <img 
          src="https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=1920&q=80" 
          alt="혁신 블로그 AI" 
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 opacity-80 mix-blend-overlay"
          referrerPolicy="no-referrer"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-emerald-950/90 via-emerald-900/40 to-transparent"></div>
        
        {/* Massive BLOG Text Overlay */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none overflow-hidden">
           <span className="text-[12rem] md:text-[20rem] font-black text-emerald-500/10 tracking-tighter select-none transform -rotate-2">
             BLOG
           </span>
        </div>

        <div className="absolute bottom-0 left-0 p-10 md:p-16 w-full flex flex-col md:flex-row md:items-end justify-between gap-8 z-10">
           <div>
             <span className="inline-block py-1 px-3 rounded-full bg-emerald-500/20 border border-emerald-500/30 backdrop-blur-md text-emerald-300 text-xs font-bold uppercase tracking-widest mb-4">
               2026 Future Edition
             </span>
             <h2 className="text-4xl md:text-6xl font-extrabold text-white drop-shadow-2xl mb-4 tracking-tight">
               혁신 블로그 AI
             </h2>
             <p className="text-emerald-50 text-lg md:text-2xl font-light max-w-2xl drop-shadow-lg">
               인공지능의 힘으로 당신만의 독창적이고 전문적인 블로그 포스팅을 완성하세요.
             </p>
           </div>
           <div className="flex-shrink-0">
             <button 
               onClick={() => onChangeView('studio')}
               className="px-8 py-4 bg-emerald-600 text-white rounded-2xl font-bold text-lg hover:bg-emerald-500 transition-all shadow-xl hover:shadow-emerald-900/50 hover:-translate-y-1 flex items-center justify-center gap-2 backdrop-blur-md border border-emerald-500/50"
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