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
              <motion.div key="styles" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-8">
                <section className="space-y-4">
                  <h3 className="text-lg font-bold text-white mb-4">카테고리별 원고 자동 매칭 시스템 분석</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {[
                      { c: '맛집/카페/제품 리뷰', s: '생생한 리뷰/체험단형', t: '직접 방문/사용한 듯한 경험 묘사와 솔직한 평가, 모바일 최적화(단락 분리)', i: Store },
                      { c: '병원/법률/금융/IT', s: '신뢰/정보전달/전문가형', t: '객관적인 데이터 중심, 논리적인 구조 완성, 확고하고 전문적인 어조', i: Building2 },
                      { c: '육아/일상/레시피', s: '공감 소통/친근한 이웃형', t: '감성적인 문구, 친절한 어투, 다양한 이모지로 부드러운 소통 체계', i: MessageCircle },
                      { c: '인테리어/시공/학원', s: '현장 밀착 스토리텔링형', t: '비포&애프터 해결과정, 고객 고민 해소 및 파트너십 구축 서사', i: GraduationCap },
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
                </section>

                <section className="space-y-4">
                  <h3 className="text-lg font-bold text-white mt-8 mb-4">플랫폼, 분류, 스타일에 따른 활용 가이드 (조합 예시)</h3>
                  <div className="flex flex-col gap-4">
                    {/* Ex 1 */}
                    <div className="bg-slate-800/40 p-5 rounded-2xl border border-slate-700/50 hover:border-emerald-500/30 transition-all">
                      <div className="flex flex-wrap items-center gap-2 mb-3">
                        <span className="bg-emerald-500/20 text-emerald-400 px-2 py-1 rounded text-[10px] font-bold">네이버 블로그</span>
                        <span className="bg-slate-700 text-slate-300 px-2 py-1 rounded text-[10px] font-bold">분류: 상업 리뷰 (맛집/제품)</span>
                        <span className="bg-slate-700 text-slate-300 px-2 py-1 rounded text-[10px] font-bold">스타일: 리뷰 / 사용기</span>
                      </div>
                      <h4 className="text-white font-bold text-sm mb-2 flex items-center gap-2">🍽️ 모바일 최적화 생생한 체험단 리뷰</h4>
                      <p className="text-xs text-slate-400 leading-relaxed">
                         가장 많은 조회수를 발생시키는 <strong>모바일 가독성(20자 줄바꿈, 2줄 단락)</strong>에 맞춰 작성됩니다. 직접 체험한 듯한 사실적인 묘사, 매장 위치와 꿀팁, 그리고 장단점 비율을 자연스럽게 섞어 네이버 스마트에디터 ONE과 가장 궁합이 좋은 결과물을 냅니다.
                      </p>
                    </div>
                    
                    {/* Ex 2 */}
                    <div className="bg-slate-800/40 p-5 rounded-2xl border border-slate-700/50 hover:border-blue-500/30 transition-all">
                      <div className="flex flex-wrap items-center gap-2 mb-3">
                        <span className="bg-blue-500/20 text-blue-400 px-2 py-1 rounded text-[10px] font-bold">티스토리 / 기타</span>
                        <span className="bg-slate-700 text-slate-300 px-2 py-1 rounded text-[10px] font-bold">분류: 정보/지식전달</span>
                        <span className="bg-slate-700 text-slate-300 px-2 py-1 rounded text-[10px] font-bold">스타일: 정보 전달(객관적)</span>
                      </div>
                      <h4 className="text-white font-bold text-sm mb-2 flex items-center gap-2">💻 장기 검색어 유입(Google SEO) 친화적 정보글</h4>
                      <p className="text-xs text-slate-400 leading-relaxed">
                         구글 검색엔진이 좋아하는 <strong>논리적인 마크다운 헤딩 구조(H2, H3), 개요, 장단점 비교, 요약 표</strong>가 깔끔하게 적용됩니다. 개인적인 감정이나 불필요한 이모지를 빼고 '정확도 및 객관성'에 집중해 구글링 상위 노출에 최적화됩니다.
                      </p>
                    </div>

                    {/* Ex 3 */}
                    <div className="bg-slate-800/40 p-5 rounded-2xl border border-slate-700/50 hover:border-indigo-500/30 transition-all">
                      <div className="flex flex-wrap items-center gap-2 mb-3">
                        <span className="bg-emerald-500/20 text-emerald-400 px-2 py-1 rounded text-[10px] font-bold">네이버 블로그</span>
                        <span className="bg-slate-700 text-slate-300 px-2 py-1 rounded text-[10px] font-bold">분류: 병원 / 법률 / 부동산</span>
                        <span className="bg-slate-700 text-slate-300 px-2 py-1 rounded text-[10px] font-bold">스타일: 전문가형 (신뢰)</span>
                      </div>
                      <h4 className="text-white font-bold text-sm mb-2 flex items-center gap-2">⚖️ 브랜드 가치 및 전환율(CVR) 상승 브랜드 블로그</h4>
                      <p className="text-xs text-slate-400 leading-relaxed">
                         고관여 타겟 고객에게 전문 지식을 쉽게 설명하되 가벼워 보이지 않는 <strong>단정한 전문의/변호사 톤앤매너</strong>로 접근합니다. AI가 해당 비즈니스 분야의 톤앤매너(예: 블루/그레이의 신뢰감 있는 썸네일 색상)를 자동 분석하여 함께 반영합니다.
                      </p>
                    </div>
                    
                    {/* Ex 4 */}
                    <div className="bg-slate-800/40 p-5 rounded-2xl border border-slate-700/50 hover:border-orange-500/30 transition-all">
                      <div className="flex flex-wrap items-center gap-2 mb-3">
                        <span className="bg-orange-500/20 text-orange-400 px-2 py-1 rounded text-[10px] font-bold">워드프레스 / 기타</span>
                        <span className="bg-slate-700 text-slate-300 px-2 py-1 rounded text-[10px] font-bold">분류: 인테리어 / 학원 / 시공</span>
                        <span className="bg-slate-700 text-slate-300 px-2 py-1 rounded text-[10px] font-bold">스타일: 일상 공유 / 공감형</span>
                      </div>
                      <h4 className="text-white font-bold text-sm mb-2 flex items-center gap-2">🏗️ 현장 체류 시간을 극대화하는 서사 스토리텔링</h4>
                      <p className="text-xs text-slate-400 leading-relaxed">
                         딱딱한 단가표 나열이 아닌, 현장에서 <strong>고객과 어떤 과정으로 소통하고 비포&애프터를 만들었는지</strong> 한 편의 다이어리나 작업 스케치처럼 전개합니다. 독자의 글 체류 시간을 대폭 늘려 블로그 지수를 올리는 데 적합합니다.
                      </p>
                    </div>
                  </div>
                </section>
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
                      <h4 className="text-white font-bold">압도적인 클릭을 부르는 이미지 생성 가이드</h4>
                      <div className="mt-4 space-y-5">
                      
                        <div className="space-y-2">
                            <strong className="text-indigo-300 block text-sm">1. 메인 썸네일 (한국어 타이틀 & 본문 맞춤 배경)</strong>
                            <p className="text-xs text-slate-400 leading-relaxed">
                                <span className="text-emerald-400 font-bold border border-emerald-500/30 px-1 py-0.5 rounded mr-1">NEW</span>
                                썸네일은 유튜브 상업용 배너처럼 <strong>강렬한 색상과 굵은 테두리의 입체적인 텍스트</strong>로 생성됩니다.<br/>
                                <strong className="text-slate-200">배경색 자동화:</strong> 법률/금융은 신뢰의 블루, 카페 리뷰는 따뜻한 오렌지 등 블로그 본문의 톤앤매너를 AI가 스스로 분석하여 썸네일 배경색을 완벽하게 맞춰줍니다.<br/>
                                <em>예시: 메인 키워드가 "강남역 맛집"일 때 ➔ 노랑/주황 배경에 대형 화이트/블랙 스트로크가 적용된 "강남역 맛집" 폰트 배치</em>
                            </p>
                        </div>
                        
                        <div className="space-y-2">
                            <strong className="text-indigo-300 block text-sm">2. 시각화 인포그래픽 (본문 기반 2줄 텍스트)</strong>
                            <p className="text-xs text-slate-400 leading-relaxed">
                                이미지 스타일을 "시각화 인포그래픽 (기본)" 혹은 "3D 미니멀 인포그래픽"으로 선택하시면, 본문의 문맥을 AI가 파악하여 <strong>가장 후킹한 2줄의 한국어 카피라이팅(메인 카피, 서브 카피)</strong>을 사진 속에 자동으로 합성해줍니다.<br/>
                                <em>예시: 입체적인 3D 오브젝트와 함께 "이제는 고민하지 마세요", "최신형 아이폰 카메라 리뷰 총정리" 등 본문 맞춤 문구가 삽입됩니다.</em>
                            </p>
                        </div>

                        <div className="space-y-2">
                           <strong className="text-indigo-300 block text-sm">3. 이미지 생성 모델 선택 가이드</strong>
                           <ul className="text-xs text-slate-400 space-y-2 list-disc list-inside">
                              <li><strong className="text-slate-200">Nano Banana 2 (Gemini 3.1):</strong> 이미지 내 한국어 텍스트 삽입(썸네일/인포그래픽)이 필요할 때 가장 추천합니다.</li>
                              <li><strong className="text-slate-200">Nano Banana 2 (이미지 위주, 텍스트 없음):</strong> 텍스트 깨짐이 우려되어 고퀄리티 피사체 중심으로만 뽑고 싶을 때 사용하세요.</li>
                              <li><strong className="text-slate-200">Gemini 2.5 Flash / Imagen 4.0:</strong> 인물이나 풍경, 음식 같은 완전 실사 사진 느낌이 필요할 때 적합합니다.</li>
                           </ul>
                        </div>
                        
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
                      <BarChart3 className="w-5 h-5" /> 20자 줄바꿈의 마법
                    </h4>
                    <p className="text-xs text-amber-200/80 leading-relaxed">
                      네이버 블로그 유입의 80% 이상은 모바일입니다. <br/>
                      리뷰 카테고리에서 한 줄당 최적의 글자 수(약 20~23자)를 지키는 이유는 모바일 화면에서 문장이 끊기지 않고 
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
          <span>Version 1.2.48</span>
          <span className="w-1 h-1 rounded-full bg-slate-700" />
          <span>Last Updated: 2026.05.31</span>
        </div>
        <p className="text-[10px] text-slate-600 italic">
          혁신 블로그 AI는 사용자의 성공적인 브랜딩을 응원합니다.
        </p>
      </div>
    </div>
  );
};

export default Manual;

