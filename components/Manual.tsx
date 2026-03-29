import React from 'react';

const Manual: React.FC = () => {
  return (
    <div className="max-w-4xl mx-auto bg-slate-900 rounded-2xl border border-slate-800 p-8 shadow-xl animate-fade-in mb-20">
      <h1 className="text-3xl font-bold text-white mb-8 flex items-center gap-3">
        <span className="text-4xl">📖</span> 혁신 블로그 AI 상세 사용 가이드
      </h1>
      
      <div className="space-y-12 text-slate-300">
        {/* Step 1 */}
        <section className="space-y-4">
          <h2 className="text-2xl font-bold text-indigo-400 flex items-center gap-2">
            <span className="bg-indigo-500/20 text-indigo-400 w-8 h-8 rounded-full flex items-center justify-center text-sm">1</span>
            시작하기 전에 (API Key 설정)
          </h2>
          <div className="bg-slate-800/50 p-5 rounded-xl border border-slate-700/50">
            <p className="leading-relaxed">
              본 서비스는 구글의 최신 AI인 <strong>Gemini</strong>를 기반으로 작동합니다. 
              서비스 이용을 위해 우측 상단의 <span className="text-white font-bold">🔑 API Key 설정</span> 메뉴에서 본인의 API Key를 입력해주세요. 
              키가 설정되지 않으면 원고 생성이 불가능합니다.
            </p>
          </div>
        </section>

        {/* Step 2 */}
        <section className="space-y-4">
          <h2 className="text-2xl font-bold text-indigo-400 flex items-center gap-2">
            <span className="bg-indigo-500/20 text-indigo-400 w-8 h-8 rounded-full flex items-center justify-center text-sm">2</span>
            블로그 올인원 설정 (원고 정보 입력)
          </h2>
          <p className="text-slate-400">원하는 블로그의 성격과 정보를 상세히 입력할수록 고품질의 원고가 생성됩니다.</p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-slate-800/30 p-6 rounded-xl border border-slate-800">
              <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">📋 기본 설정</h3>
              <ul className="space-y-3 text-sm">
                <li><span className="text-indigo-300 font-semibold">플랫폼:</span> 네이버, 티스토리, 워드프레스 중 선택 (플랫폼별 최적화 로직 적용)</li>
                <li><span className="text-indigo-300 font-semibold">블로그 분류:</span> 맛집, IT, 일상, 정보성 등 10가지 이상의 카테고리 지원</li>
                <li><span className="text-indigo-300 font-semibold">블로그 스타일:</span> 전문가형, 친근한 이웃형, 감성 에세이형 등 6가지 문체 선택 가능</li>
              </ul>
            </div>

            <div className="bg-slate-800/30 p-6 rounded-xl border border-slate-800">
              <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">🚀 핵심 정보</h3>
              <ul className="space-y-3 text-sm">
                <li><span className="text-indigo-300 font-semibold">주제 & USP:</span> 포스팅할 주제를 입력하면 AI가 자동으로 핵심 소구점(USP)을 생성합니다.</li>
                <li><span className="text-indigo-300 font-semibold">벤치마킹 원고:</span> 경쟁사의 잘 쓴 글을 복사해 넣으면, AI가 해당 글의 <strong>논리 구조와 톤앤매너</strong>만 분석하여 유사 문서 걱정 없는 새로운 글을 창조합니다.</li>
              </ul>
            </div>
          </div>
        </section>

        {/* Step 3 */}
        <section className="space-y-4">
          <h2 className="text-2xl font-bold text-indigo-400 flex items-center gap-2">
            <span className="bg-indigo-500/20 text-indigo-400 w-8 h-8 rounded-full flex items-center justify-center text-sm">3</span>
            이미지 에셋 및 세탁 기능
          </h2>
          <div className="bg-slate-800/50 p-6 rounded-xl border border-slate-700/50 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <h4 className="text-teal-400 font-bold text-sm">🖼️ 이미지 소스 활용</h4>
                <p className="text-xs leading-relaxed">
                  로고, 인물, 참고 이미지를 업로드하면 AI가 원고 작성 시 해당 이미지들을 적재적소에 배치하도록 가이드를 제공합니다.
                </p>
              </div>
              <div className="space-y-2">
                <h4 className="text-amber-400 font-bold text-sm">🧼 세탁 이미지 (Hash 변경)</h4>
                <p className="text-xs leading-relaxed">
                  기존 이미지를 그대로 사용하고 싶지만 '유사 이미지' 판독이 걱정될 때 사용하세요. 
                  <strong>이미지 변형 없이</strong> 데이터 값만 미세하게 변경하여 새로운 이미지로 인식되게끔 처리합니다.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Step 4 */}
        <section className="space-y-4">
          <h2 className="text-2xl font-bold text-indigo-400 flex items-center gap-2">
            <span className="bg-indigo-500/20 text-indigo-400 w-8 h-8 rounded-full flex items-center justify-center text-sm">4</span>
            자동화 프로세스 및 결과물
          </h2>
          <div className="space-y-6">
            <div className="flex items-start gap-4">
              <div className="bg-indigo-500 text-white w-6 h-6 rounded-full flex-shrink-0 flex items-center justify-center text-xs font-bold mt-1">1</div>
              <div>
                <h4 className="text-white font-bold">키워드 분석 및 선택</h4>
                <p className="text-sm text-slate-400">주제를 바탕으로 AI가 추천 키워드를 제안하며, 사용자가 직접 선택하거나 수정할 수 있습니다.</p>
              </div>
            </div>
            <div className="flex items-start gap-4">
              <div className="bg-indigo-500 text-white w-6 h-6 rounded-full flex-shrink-0 flex items-center justify-center text-xs font-bold mt-1">2</div>
              <div>
                <h4 className="text-white font-bold">이미지 생성 개수 설정</h4>
                <p className="text-sm text-slate-400">AI 추천 방식 외에도 3개, 5개, 10개, 15개 등 원하는 이미지 개수를 직접 지정할 수 있습니다.</p>
              </div>
            </div>
            <div className="flex items-start gap-4">
              <div className="bg-indigo-500 text-white w-6 h-6 rounded-full flex-shrink-0 flex items-center justify-center text-xs font-bold mt-1">3</div>
              <div>
                <h4 className="text-white font-bold">고도화된 원고 생성</h4>
                <ul className="list-disc pl-5 text-sm text-slate-400 space-y-1 mt-1">
                  <li><span className="text-slate-200">SEO 최적화 도입부:</span> 지루한 Q&A 대신 독자의 시선을 끄는 강력한 훅(Hook)으로 시작합니다.</li>
                  <li><span className="text-slate-200">가독성 극대화:</span> 모든 문단은 2줄 단위로 구성되어 모바일에서도 읽기 편합니다.</li>
                  <li><span className="text-slate-200">전문적인 서식:</span> 소제목은 인용구(Blockquote) 스타일로, 표의 첫 행은 강조 색상이 적용됩니다.</li>
                </ul>
              </div>
            </div>
          </div>
        </section>

        {/* Step 5 */}
        <section className="space-y-4">
          <h2 className="text-2xl font-bold text-indigo-400 flex items-center gap-2">
            <span className="bg-indigo-500/20 text-indigo-400 w-8 h-8 rounded-full flex items-center justify-center text-sm">5</span>
            복사 및 발행 (Copy & Publish)
          </h2>
          <div className="bg-indigo-900/20 border border-indigo-500/30 p-6 rounded-xl space-y-4">
            <p className="text-sm leading-relaxed">
              완성된 원고 하단의 <span className="text-white font-bold">📋 본문 복사 (표/인용구 포함)</span> 버튼을 클릭하세요. 
              단순 텍스트가 아닌 <strong>서식이 포함된 HTML 데이터</strong>가 복사됩니다.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              <div className="bg-slate-800 p-3 rounded-lg">
                <h5 className="text-indigo-300 font-bold mb-1">✅ 복사 시 유지되는 항목</h5>
                <ul className="space-y-1">
                  <li>• 문단 간 실제 공백 라인 (2줄 간격)</li>
                  <li>• 표(Table)의 구조와 헤더 색상</li>
                  <li>• 인용구(Blockquote) 및 텍스트 강조 색상</li>
                </ul>
              </div>
              <div className="bg-slate-800 p-3 rounded-lg">
                <h5 className="text-indigo-300 font-bold mb-1">📥 이미지 다운로드</h5>
                <p>생성된 이미지와 세탁 이미지를 한 번에 다운로드하거나 개별적으로 저장할 수 있습니다.</p>
              </div>
            </div>
          </div>
        </section>

        <section className="pt-8 border-t border-slate-800">
          <div className="flex items-center gap-4 text-slate-400 text-sm italic">
            <span>💡</span>
            <p>모든 원고는 생성 후 반드시 한 번 더 검토하여 브랜드의 실제 정보와 일치하는지 확인하시기 바랍니다.</p>
          </div>
        </section>
      </div>
    </div>
  );
};

export default Manual;
