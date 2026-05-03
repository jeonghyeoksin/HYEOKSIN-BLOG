import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  X, BookOpen, Key, Settings, Zap, Image as ImageIcon, 
  Copy, BarChart3, Info, ChevronRight, CheckCircle2, 
  MessageCircle, Building2, Store, GraduationCap, Utensils
} from 'lucide-react';

interface ManualProps {
  onClose: () => void;
}

const Manual: React.FC<ManualProps> = ({ onClose }) => {
  const [activeTab, setActiveTab] = useState<'intro' | 'basics' | 'process' | 'styles' | 'assets' | 'tips'>('intro');

  const tabs = [
    { id: 'intro', label: '서비스 개요', icon: Info },
    { id: 'basics', label: '기본 설정', icon: Key },
    { id: 'process', label: '작성 프로세스', icon: Zap },
    { id: 'styles', label: '분류 & 스타일', icon: Settings },
    { id: 'assets', label: '이미지 활용', icon: ImageIcon },
    { id: 'tips', label: 'SEO 꿀팁', icon: BarChart3 },
  ] as const;

  return (
    <div className="max-w-6xl mx-auto bg-slate-900 rounded-3xl border border-slate-800 shadow-2xl animate-fade-in mb-20 overflow-hidden">
      {/* Header */}
      <div className="p-8 border-b border-slate-800 bg-slate-800/30 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center">
            <BookOpen className="w-8 h-8 text-indigo-400" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-white flex items-center gap-3">
              혁신 블로그 AI 마스터 클래스
            </h1>
            <p className="text-slate-400 mt-1">상위 1% 블로거의 로직을 AI로 구현한 완벽한 가이드</p>
          </div>
        </div>
        <button 
          onClick={onClose}
          className="p-3 hover:bg-slate-700 rounded-xl transition-all text-slate-400 hover:text-white border border-transparent hover:border-slate-600"
        >
          <X className="w-6 h-6" />
        </button>
      </div>

      <div className="flex flex-col md:flex-row min-h-[600px]">
        {/* Sidebar Tabs */}
        <div className="w-full md:w-64 bg-slate-950/50 border-r border-slate-800 p-4 space-y-2">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-xl font-bold transition-all text-sm ${
                activeTab === tab.id 
                  ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/20' 
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
              }`}
            >
              <tab.icon className={`w-5 h-5 ${activeTab === tab.id ? 'text-white' : 'text-indigo-400/70'}`} />
              {tab.label}
              {activeTab === tab.id && <motion.div layoutId="activeDot" className="ml-auto w-1.5 h-1.5 rounded-full bg-white" />}
            </button>
          ))}
        </div>

        {/* Content Area */}
        <div className="flex-1 p-8 overflow-y-auto max-h-[70vh] custom-scrollbar bg-slate-900/20">
          <AnimatePresence mode="wait">
            {activeTab === 'intro' && (
              <motion.div key="intro" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-8">
                <div className="p-8 rounded-3xl bg-gradient-to-br from-indigo-600/20 to-purple-600/20 border border-indigo-500/30">
                  <h2 className="text-2xl font-bold text-white mb-4">반갑습니다! 혁신 블로그 AI입니다. 👋</h2>
                  <p className="text-slate-300 leading-relaxed">
                    이 서비스는 단순한 글쓰기 도구가 아닙니다. <br/>
                    <strong>Gemini 1.5 Pro</strong>의 강력한 추론 능력과 현대 블로그 검색 엔진(Naver, Google)의 
                    상위 노출 알고리즘을 결합하여, 전문가 수준의 포스팅을 단 몇 초 만에 생성합니다.
                  </p>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                  {[
                    { t: '시간 단축', d: '평균 1시간 걸리던 포스팅을 3분 내에 완성', i: Zap, c: 'text-amber-400' },
                    { t: 'SEO 최적화', d: '한 줄 글자수, 인용구 배치, 키워드 밀도 자동 관리', i: BarChart3, c: 'text-emerald-400' },
                    { t: '멀티 플랫폼', d: '네이버, 티스토리, 워드프레스 맞춤형 서식 적용', i: Copy, c: 'text-indigo-400' },
                  ].map((item, idx) => (
                    <div key={idx} className="p-5 rounded-2xl bg-slate-800/40 border border-slate-700/50">
                      <item.i className={`w-6 h-6 ${item.c} mb-3`} />
                      <h3 className="text-white font-bold mb-1">{item.t}</h3>
                      <p className="text-xs text-slate-400 leading-relaxed">{item.d}</p>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}

            {activeTab === 'basics' && (
              <motion.div key="basics" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-8">
                <section className="space-y-4">
                  <h3 className="text-xl font-bold text-white mb-2 flex items-center gap-2">
                    <Key className="w-5 h-5 text-indigo-400" /> API 키 설정 가이드
                  </h3>
                  <div className="bg-slate-800/50 p-6 rounded-2xl border border-slate-700/50 space-y-4">
                    <p className="text-sm text-slate-300 leading-relaxed">
                      모든 원고 생성은 사용자의 <strong>Gemini API Key</strong>를 통해 이루어집니다. 
                    </p>
                    <div className="bg-slate-900 p-4 rounded-xl space-y-3">
                      <div className="flex items-center gap-2 text-xs text-indigo-300 font-bold">
                        <CheckCircle2 className="w-4 h-4" /> 발급 방법
                      </div>
                      <ol className="text-xs text-slate-400 space-y-2 list-decimal list-inside px-1">
                        <li>Google AI Studio 접속 (<a href="https://aistudio.google.com/" target="_blank" className="text-indigo-400 underline">aistudio.google.com</a>)</li>
                        <li>'Get API Key' 메뉴 클릭 후 새 키 생성</li>
                        <li>복사한 키를 우리 앱 상단의 <span className="text-white font-bold">[🔑 API Key 설정]</span>에 붙여넣기</li>
                      </ol>
                    </div>
                  </div>
                </section>
                <div className="bg-blue-500/10 border border-blue-500/20 p-5 rounded-2xl flex gap-4">
                  <Info className="w-6 h-6 text-blue-400 shrink-0 mt-1" />
                  <div className="space-y-1">
                    <h4 className="text-sm font-bold text-blue-300">데이터 보안 알림</h4>
                    <p className="text-xs text-slate-400 leading-relaxed">입력하신 API 키는 서버에 저장되지 않고 브라우저의 로컬 스토리지에만 저장됩니다. 안심하고 사용하세요.</p>
                  </div>
                </div>
              </motion.div>
            )}

            {activeTab === 'process' && (
              <motion.div key="process" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-8">
                <div className="relative">
                  <div className="absolute left-[20px] top-4 bottom-4 w-0.5 bg-slate-800" />
                  {[
                    { t: '주제 입력', d: '작성하고자 하는 핵심 주제를 입력합니다. 매장명이나 제품명이 포함되면 좋습니다.', i: '01' },
                    { t: 'USP & 개요 발굴', d: 'AI가 주제를 분석하여 소구점(USP)과 목차(Outline)를 자동 생성합니다. 마음에 들지 않으면 수정 가능!', i: '02' },
                    { t: '데이터 연동 (선택)', d: '참고 링크나 벤치마킹 원고가 있다면 필수 입력! AI가 이를 토대로 정보를 보강합니다.', i: '03' },
                    { t: '본문 생성', d: '설정한 플랫폼/스타일/분량에 맞춰 AI가 본문을 작성합니다. 인용구와 표가 자동으로 삽입됩니다.', i: '04' },
                    { t: '에셋 완료 및 복사', d: '생성된 본문을 복사하여 블로그 에디터에 붙여넣고 이미지를 다운로드하여 배치합니다.', i: '05' },
                  ].map((step, idx) => (
                    <div key={idx} className="relative pl-12 mb-8 last:mb-0">
                      <div className="absolute left-0 top-1 w-10 h-10 rounded-full bg-slate-900 border-2 border-indigo-500/50 flex items-center justify-center z-10 text-xs font-black text-indigo-400">
                        {step.i}
                      </div>
                      <h4 className="text-white font-bold mb-1">{step.t}</h4>
                      <p className="text-xs text-slate-400 leading-relaxed">{step.d}</p>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}

            {activeTab === 'styles' && (
              <motion.div key="styles" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-6">
                <h3 className="text-lg font-bold text-white mb-4">분류에 따른 자동 매칭 시스템</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {[
                    { c: '맛집/카페/제품 리뷰', s: '리뷰/체험단형', t: '직경경험 묘사, 생동감, 솔직한 평가', i: Store },
                    { c: '병원/법률/금융/IT', s: '전문가/정보전달형', t: '논리적 구조, 객관적 데이터, 신뢰감', i: Building2 },
                    { c: '육아/일상/레시피', s: '친근한 이웃형', t: '공감 문구, 친절한 설명, 이모지 활용', i: MessageCircle },
                    { c: '인테리어/시공/학원', s: '현장 밀착형 스토리', t: '비포&애프터, 작업 일지, 파트너십', i: GraduationCap },
                  ].map((item, idx) => (
                    <div key={idx} className="bg-slate-800/30 p-4 rounded-2xl border border-slate-800 hover:border-indigo-500/50 transition-colors">
                      <div className="flex items-center gap-3 mb-2">
                        <item.i className="w-5 h-5 text-indigo-400" />
                        <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">{item.c}</span>
                      </div>
                      <h4 className="text-white font-bold text-sm mb-1">{item.s}</h4>
                      <p className="text-[11px] text-slate-500 leading-relaxed">{item.t}</p>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}

            {activeTab === 'assets' && (
              <motion.div key="assets" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-8">
                <div className="bg-slate-800/50 p-6 rounded-2xl border border-slate-700/50 space-y-6">
                  <div className="flex gap-4">
                    <div className="w-12 h-12 rounded-xl bg-purple-600/20 flex items-center justify-center shrink-0">
                      <ImageIcon className="w-7 h-7 text-purple-400" />
                    </div>
                    <div>
                      <h4 className="text-white font-bold">AI 이미지 생성 모델 가이드</h4>
                      <div className="mt-3 space-y-3">
                        <div className="text-xs text-slate-400"><strong className="text-slate-200">Gemini 3.1 Flash Image:</strong> 이미지 내 한글/영어 텍스트 삽입이 필요한 카드뉴스나 상세페이지풍 이미지에 추천</div>
                        <div className="text-xs text-slate-400"><strong className="text-slate-200">Imagen 4.0:</strong> 인물, 음식, 풍경 등 감성적이고 실사 같은 퀄리티가 필요할 때 추천</div>
                      </div>
                    </div>
                  </div>
                  <div className="border-t border-slate-700 pt-6 flex gap-4">
                    <div className="w-12 h-12 rounded-xl bg-teal-600/20 flex items-center justify-center shrink-0">
                      <Zap className="w-7 h-7 text-teal-400" />
                    </div>
                    <div>
                      <h4 className="text-white font-bold">이미지 세탁(Hash 변경) 기능</h4>
                      <p className="text-xs text-slate-400 leading-relaxed mt-2">
                        브랜드에서 제공받은 공용 이미지를 그대로 사용하면 '유사 문서/이미지' 판독으로 인해 저품질 위험이 있습니다. <br/>
                        <strong>이미지 세탁</strong> 기능을 사용하면 육안으로는 동일하지만 데이터 내부 값이 변경되어 검색 엔진이 '새로운 이미지'로 인식하게 됩니다.
                      </p>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {activeTab === 'tips' && (
              <motion.div key="tips" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="p-6 rounded-2xl bg-amber-500/10 border border-amber-500/20">
                    <h4 className="text-amber-400 font-bold mb-3 flex items-center gap-2">
                      <BarChart3 className="w-5 h-5" /> 15자 줄바꿈의 마법
                    </h4>
                    <p className="text-xs text-amber-200/80 leading-relaxed">
                      네이버 블로그 유입의 80% 이상은 모바일입니다. <br/>
                      리뷰 카테고리에서 한 줄당 15자를 지키는 이유는 모바일 화면에서 문장이 끊기지 않고 
                      <strong>한 눈에 들어오는 시인성</strong>을 확보하기 위함입니다. AI가 이를 자동으로 계산하여 작성합니다.
                    </p>
                  </div>
                  <div className="p-6 rounded-2xl bg-emerald-500/10 border border-emerald-500/20">
                    <h4 className="text-emerald-400 font-bold mb-3 flex items-center gap-2">
                      <Store className="w-5 h-5" /> 참고 링크 크롤링
                    </h4>
                    <p className="text-xs text-emerald-200/80 leading-relaxed">
                      리뷰 작성 시 참고 링크를 넣으면 AI가 해당 페이지를 직접 방문합니다. <br/>
                      매장 위치, 영업시간, 시그니처 메뉴명 등을 실수 없이 정확하게 글에 녹여낼 수 있습니다. 
                      <strong>데이터의 정확도</strong>가 신뢰를 만듭니다.
                    </p>
                  </div>
                </div>
                <div className="p-6 rounded-2xl bg-slate-800/50 border border-slate-700">
                  <h4 className="text-white font-bold mb-3">📋 올바른 복사 및 발행법</h4>
                  <p className="text-sm text-slate-400 leading-relaxed">
                    본문 하단의 복사 버튼은 <strong>Rich Text</strong> 데이터를 복사합니다. <br/>
                    메모장이 아닌 블로그 에디터(스마트에디터 ONE 등)에 직접 붙여넣으세요. 
                    인용구 상자, 표의 스타일, 글꼴 강조가 그대로 유지됩니다.
                  </p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Footer */}
      <div className="p-6 bg-slate-950 border-t border-slate-800 flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-4 text-[11px] text-slate-500 font-bold uppercase tracking-widest">
          <span>Version 2.5</span>
          <span className="w-1 h-1 rounded-full bg-slate-700" />
          <span>Last Updated: 2026.05.03</span>
        </div>
        <p className="text-[10px] text-slate-600 italic">
          혁신 블로그 AI는 사용자의 성공적인 브랜딩을 응원합니다.
        </p>
      </div>
    </div>
  );
};

export default Manual;

