import React from 'react';

const Manual: React.FC = () => {
  return (
    <div className="max-w-4xl mx-auto bg-slate-900 rounded-2xl border border-slate-800 p-8 shadow-xl animate-fade-in">
      <h1 className="text-3xl font-bold text-white mb-6 flex items-center gap-3">
        <span>📖</span> 혁신 블로그 AI 사용 매뉴얼
      </h1>
      
      <div className="space-y-8 text-slate-300">
        <section className="space-y-4">
          <h2 className="text-xl font-bold text-indigo-400 border-b border-slate-800 pb-2">1. 시작하기 전에 (API Key 설정)</h2>
          <p>
            본 서비스를 이용하기 위해서는 <strong>Gemini API Key</strong>가 필요합니다.
            우측 상단의 <span className="text-white font-semibold">🔑 API Key 설정</span> 메뉴를 클릭하여 발급받은 API Key를 입력해주세요.
          </p>
        </section>

        <section className="space-y-4">
          <h2 className="text-xl font-bold text-indigo-400 border-b border-slate-800 pb-2">2. 블로그 올인원 (원고 자동 생성)</h2>
          <p>
            상단 메뉴의 <span className="text-white font-semibold">블로그 올인원</span>을 클릭하면 블로그 원고를 자동으로 생성할 수 있는 스튜디오로 이동합니다.
          </p>
          
          <div className="bg-slate-800/50 p-6 rounded-xl space-y-4">
            <h3 className="text-lg font-semibold text-white">기본 정보 입력</h3>
            <ul className="list-disc pl-5 space-y-2">
              <li><strong>블로그 플랫폼:</strong> 네이버, 티스토리, 워드프레스 중 선택합니다. (네이버 선택 시 스마트플레이스 정보 연동)</li>
              <li><strong>블로그 분류:</strong> 맛집 리뷰, IT/테크, 일상, 정보성 등 블로그의 성격을 선택합니다.</li>
              <li><strong>블로그 주제:</strong> 작성하고자 하는 핵심 토픽을 자유롭게 입력합니다.</li>
              <li><strong>블로그 스타일:</strong> 전문가형, 친근한 이웃형, 감성 에세이형 등 원하는 문체와 톤앤매너를 선택합니다.</li>
            </ul>

            <h3 className="text-lg font-semibold text-white mt-6">브랜드 및 제품 정보</h3>
            <ul className="list-disc pl-5 space-y-2">
              <li><strong>상호명 / 브랜드명:</strong> 홍보하고자 하는 브랜드 이름을 입력합니다.</li>
              <li><strong>판매 제품 / 서비스:</strong> 구체적인 제품이나 서비스 명을 입력합니다.</li>
              <li><strong>포스팅 목적 (USP):</strong> 글을 통해 달성하고자 하는 목적이나 제품의 특장점을 입력합니다.</li>
            </ul>

            <h3 className="text-lg font-semibold text-white mt-6">추가 옵션 (선택 사항)</h3>
            <ul className="list-disc pl-5 space-y-2">
              <li><strong>참고 자료 첨부:</strong> PDF, 텍스트 파일 등을 업로드하여 AI가 참고하도록 할 수 있습니다.</li>
              <li><strong>벤치마킹 원고:</strong> 카피하고 싶은 잘 쓰여진 원고를 입력하면 해당 글의 구조와 톤을 분석하여 유사한 흐름으로 작성합니다.</li>
              <li><strong>필수 포함 내용:</strong> 반드시 들어가야 하는 문구나 조건(예: 특정 키워드 3번 반복)을 입력합니다.</li>
            </ul>
          </div>
        </section>

        <section className="space-y-4">
          <h2 className="text-xl font-bold text-indigo-400 border-b border-slate-800 pb-2">3. 자동화 프로세스 진행</h2>
          <p>
            모든 정보를 입력한 후 <span className="text-white font-semibold bg-slate-700 px-2 py-1 rounded">블로그 주제로 바로 시작하기</span> 버튼을 누르면 다음 단계가 자동으로 진행됩니다.
          </p>
          <ol className="list-decimal pl-5 space-y-3">
            <li><strong>키워드 분석:</strong> 입력한 주제를 바탕으로 검색량이 높고 경쟁력이 있는 키워드를 추천합니다.</li>
            <li><strong>원고 생성:</strong> 선택한 설정과 톤앤매너에 맞춰 최적화된 블로그 원고(개요 및 본문)를 작성합니다.</li>
            <li><strong>이미지 생성:</strong> 본문 내용에 어울리는 삽화 이미지를 AI가 자동으로 생성합니다.</li>
            <li><strong>썸네일 생성:</strong> 블로그 포스팅의 얼굴이 될 매력적인 썸네일 이미지를 생성합니다.</li>
            <li><strong>최종 결과:</strong> 완성된 원고와 이미지를 확인하고 복사하여 실제 블로그에 발행합니다.</li>
          </ol>
        </section>

        <section className="space-y-4">
          <h2 className="text-xl font-bold text-indigo-400 border-b border-slate-800 pb-2">4. 팁 및 주의사항</h2>
          <ul className="list-disc pl-5 space-y-2">
            <li><strong>맛집 리뷰:</strong> 블로그 분류를 '맛집 리뷰'로 선택하면 주소, 영업시간, 주차 여부 등 필수 정보가 자동으로 포함됩니다.</li>
            <li><strong>네이버 스마트플레이스:</strong> 플랫폼을 '네이버'로 선택하고 상호명을 입력하면, 실제 네이버 지도의 정보를 바탕으로 더 정확한 리뷰가 작성됩니다.</li>
            <li><strong>이미지 재생성:</strong> 생성된 이미지가 마음에 들지 않으면 각 이미지 하단의 '재생성' 버튼을 눌러 새로운 이미지를 만들 수 있습니다.</li>
          </ul>
        </section>
      </div>
    </div>
  );
};

export default Manual;
