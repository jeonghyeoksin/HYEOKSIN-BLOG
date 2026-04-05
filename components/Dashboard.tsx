import React from 'react';
import { ViewState } from '../types';

interface DashboardProps {
  onChangeView: (view: ViewState) => void;
}

const Dashboard: React.FC<DashboardProps> = ({ onChangeView }) => {
  return (
    <div className="animate-fade-in space-y-12 py-10">
      {/* Top 16:9 Banner Image */}
      <div className="w-full aspect-[21/9] rounded-3xl overflow-hidden shadow-2xl border border-emerald-500/20 relative group bg-slate-950">
        <img 
          src="https://images.unsplash.com/photo-1639322537228-f710d846310a?auto=format&fit=crop&w=1920&q=80" 
          alt="혁신 블로그 AI" 
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-[2000ms] ease-out opacity-60"
          referrerPolicy="no-referrer"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-slate-950 via-slate-950/60 to-transparent"></div>
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent to-transparent"></div>
        
        {/* Massive BLOG Text Overlay */}
        <div className="absolute inset-0 flex items-center justify-end pointer-events-none overflow-hidden pr-20">
           <span className="text-[15rem] font-black text-emerald-500/5 tracking-tighter select-none transform rotate-12">
             BLOG
           </span>
        </div>

        <div className="absolute bottom-0 left-0 p-10 md:p-16 w-full flex flex-col md:flex-row md:items-end justify-between gap-8 z-10">
           <div className="max-w-2xl">
             <span className="inline-flex items-center gap-2 py-1.5 px-4 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-bold uppercase tracking-widest mb-6">
               <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
               Hyeoksin Blog AI Platform
             </span>
             <h2 className="text-5xl md:text-7xl font-black text-white mb-6 tracking-tighter leading-tight">
               혁신적인<br/>
               블로그 포스팅<br/>
               <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-cyan-400">AI로 자동화 하세요!</span>
             </h2>
             <p className="text-slate-300 text-lg md:text-xl font-medium max-w-xl leading-relaxed">
               검색엔진 최적화 (SEO)<br/>
               생성형 AI 엔진 최적화 (GEO)<br/>
               기반의 블로그 글과 이미지를<br/>
               단, 한 번의 클릭으로 전문가 수준의<br/>
               블로그 콘텐츠를 완성합니다!
             </p>
           </div>
           <div className="flex-shrink-0">
             <button 
               onClick={() => onChangeView('studio')}
               className="group relative px-10 py-5 bg-gradient-to-r from-emerald-500 to-emerald-600 text-white rounded-2xl font-black text-lg hover:from-emerald-400 hover:to-emerald-500 transition-all shadow-[0_0_30px_-5px_rgba(16,185,129,0.5)] hover:shadow-[0_0_50px_-5px_rgba(16,185,129,0.7)] hover:-translate-y-1 flex items-center justify-center gap-3 border border-emerald-400/30 overflow-hidden"
             >
               <span className="relative z-10 flex items-center gap-3">새 포스팅 작성하기 ⚡️</span>
               <div className="absolute inset-0 bg-white/20 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000 ease-in-out"></div>
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
          <h3 className="text-xl font-bold text-slate-100 mb-3">최신 트렌드 반영</h3>
          <p className="text-slate-400 leading-relaxed">
            단순한 글쓰기가 아닙니다. 최신 시점에서 바라본 미래지향적인 인사이트를 담아 독자들을 사로잡으세요.
          </p>
        </div>

        {/* Card 2 */}
        <div className="bg-slate-800/50 p-8 rounded-2xl shadow-sm border border-slate-700 hover:shadow-xl transition-all duration-300 group cursor-default backdrop-blur-sm hover:bg-slate-800">
          <div className="w-14 h-14 rounded-2xl bg-emerald-900/50 text-emerald-400 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300 border border-emerald-500/20">
             <span className="text-2xl">🎨</span>
          </div>
          <h3 className="text-xl font-bold text-slate-100 mb-3">자동화된 비주얼</h3>
          <p className="text-slate-400 leading-relaxed">
            최신 AI 이미지 모델이 글의 맥락을 이해하고, 가장 적합한 1:1 썸네일과 인포그래픽을 즉시 생성합니다.
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