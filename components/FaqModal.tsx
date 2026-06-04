import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';

interface FaqModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface FaqItem {
  question: string;
  answer: React.ReactNode;
  category: string;
}

const FAQ_ITEMS: FaqItem[] = [
  {
    category: "🔑 시작 준비",
    question: "구글 API KEY가 무엇인가요? 어떻게 발급 받나요?",
    answer: (
      <div className="space-y-2 text-slate-300 text-xs sm:text-sm">
        <p>구글 API KEY는 이 앱에 똑똑한 구글 인공지능 비서를 직접 연결해 주는 <strong className="text-amber-400">‘개인 전용 인증 코드’</strong>입니다. 구글 계정을 가지고 계시다면 누구나 아래 순서를 차근차근 따라서 1분 만에 안전하게 직접 발급받으실 수 있어요!</p>
        <ol className="list-decimal pl-5 space-y-1 text-slate-300 text-xs text-left">
          <li>네이버나 구글 창에 <strong className="text-white font-semibold">‘Google AI Studio’</strong>라고 검색한 뒤 홈페이지에 접속하세요.</li>
          <li>화면 왼쪽 위에 있는 파란색 <strong className="text-indigo-400">‘Get API Key’(비밀코드 받기)</strong>를 누릅니다.</li>
          <li><strong className="text-white font-semibold">‘Create API Key’</strong> 버튼을 눌러 나오는 영어와 숫자가 마구 섞인 긴 무작위 보안 코드를 <strong className="text-emerald-400 font-bold">복사(Copy)</strong>하세요.</li>
          <li>우리 화면 우측 제일 상단에 있는 <strong className="text-indigo-400">‘인공지능 열쇠 등록’</strong> 버튼을 눌러 그 코드를 붙여넣기만 하면 글 쓰기 준비 완료입니다!</li>
        </ol>
      </div>
    )
  },
  {
    category: "📝 쉬운 사용법",
    question: "블로그나 컴퓨터가 처음인데, 글을 쓰는 전체적인 순서가 궁금해요!",
    answer: (
      <div className="space-y-2 text-slate-300 text-xs sm:text-sm">
        <p>전혀 어려워하실 필요 없답니다! 아래 길을 따라 차근차근 도장 깨기 하듯 버튼만 톡톡 눌러주시면 멋진 블로그 글과 전용 대표 이미지가 탄생해요.</p>
        <ul className="list-disc pl-5 space-y-1 text-slate-300 text-xs text-left">
          <li><strong>1단계 (카테고리 선택):</strong> 쓰고자 하는 주제(예: 맛집 리뷰, 도서 리뷰 등)를 골라주세요.</li>
          <li><strong>2단계 (주제 자동 세팅):</strong> 아래 <strong className="text-indigo-400">✨ SEO, GEO 최적화 주제 추천받기</strong> 버튼을 누릅니다. 구글 AI가 요즘 유독 인기가 많고 검색이 잘 되는 제목과 키워드, 어조를 대신 꽉꽉 채워줍니다.</li>
          <li><strong>3단계 (뼈대 조율하기):</strong> 하단의 <strong className="text-indigo-400">‘다음 단계로 이동’</strong> 단추를 누르며 가이드에 따라 글 속에 꼭 녹여내고 싶은 매장의 특장점(소구점)과 세부 차례(목차)를 마우스 클릭만으로 확정해 줍니다.</li>
          <li><strong>4단계 (글 완성 및 복사):</strong> 최종 원고 생성을 누르면 감성적이고 알찬 문장과 본문에 쏙 어울리는 이쁜 썸네일/그림들이 자동 완성됩니다. 이를 그대로 블로그로 옮겨 담아 주시면 된답니다.</li>
        </ul>
      </div>
    )
  },
  {
    category: "✨ 대박 추천",
    question: "‘SEO/GEO 최적화 주제 추천받기’ 단추는 왜 눌러야 효과를 보나요?",
    answer: (
      <div className="space-y-1.5 text-slate-300 text-xs sm:text-sm">
        <p>블로그 초보분의 가장 큰 고민인 ‘오늘 무슨 제목으로 어떤 단어를 넣어 글을 써야 노출이 잘 될까?’ 하는 점을 확실하게 지워주는 똑똑한 해결사입니다.</p>
        <p className="leading-relaxed text-xs">
          구글 글 분석 비서가 최근 많이 찾는 검색 패턴(<strong className="text-indigo-300 font-semibold">SEO</strong>)과 요즘 대세인 ChatGPT나 구글 제미나이 같은 인공지능 검색 추천(<strong className="text-indigo-300 font-semibold">GEO</strong>) 시스템 분석을 직접 마쳤습니다. 사람들이 무릎을 탁 치며 검색 창에 입력하게 될 유력한 단어들과 어울리는 다정다감한 말투를 즉석에서 정성스럽게 구성해 드립니다.
        </p>
      </div>
    )
  },
  {
    category: "🚨 글 생성 에러",
    question: "버튼을 눌렀는데 다음 단계로 안 넘어가거나 에러 글자가 떠요!",
    answer: (
      <div className="space-y-1.5 text-slate-300 text-xs sm:text-sm">
        <p>글을 작성하는 중에 진행이 안 되거나 막히는 느낌이 든다면, 아래의 대표적인 확인 사항 세 가지만 가볍게 확인해 보세요. 대부분 가뿐하게 해결됩니다!</p>
        <ul className="list-disc pl-5 space-y-1 text-slate-300 text-xs text-left">
          <li><strong>등록해주신 구글 API KEY가 빠졌거나 틀렸는지 확인:</strong> 화면 우측 맨 위에 있는 열쇠 모양 아이콘을 눌러서, 구글에서 직접 복사해 오신 영어와 숫자로 된 코드가 틀림없이 올바르게 붙어 있는지 한 번 더 살펴봐 주세요.</li>
          <li><strong>참고 주소 링크 체크하기:</strong> 만약 맛집 리뷰 등을 쓰기 위해 참고 주소(링크) 항목을 켜두셨다면, 인터넷 주소 칸이 올바른 네이버 지도 플레이스 링크 등이 맞는지 확인하세요. 관련 없는 글자만 들어있다면 정보를 긁어오지 못해 멈출 수 있습니다.</li>
          <li><strong>인터넷 연결 끊김 현상:</strong> 가끔 네트워크가 잠깐 불안정해지면 발생하기도 하니, 마음 편히 이 창을 새로고침(F5)하여 다시 톡 연동해 실행하시면 맑게 풀립니다.</li>
        </ul>
      </div>
    )
  },
  {
    category: "🔗 참고 링크",
    question: "‘참고 링크’ 칸은 무엇이며, 언제 꼭 적어 두어야 하나요?",
    answer: (
      <div className="space-y-1.5 text-slate-300 text-xs sm:text-sm">
        <p>내가 다녀왔던 맛집의 네이버 지도 주소나 구입했던 물건의 공식 온라인 상세 주소를 적어두는 곳이에요.</p>
        <p className="leading-relaxed text-xs">
          인공지능 도우미가 이 주소에 담긴 실제 마케팅 가치, 판매 가격, 메뉴 이름, 운영 시간, 제품의 실물 규격 정보를 착오 없이 정확하게 파악해 깔끔한 진짜 수필로 풀어나갑니다. <strong className="text-[#10b981] font-semibold">정보가 거짓으로 마구 지어지는 현상을 완전하게 막을 수 있죠!</strong> 일반 수필이나 영화 명대사, 서평 등은 빈칸으로 두셔도 척척 써내니 걱정 안 하셔도 돼요.
        </p>
      </div>
    )
  },
  {
    category: "🖼️ 그림 스킵 기술",
    question: "이미지를 매번 그리는 게 조금 귀찮은데, 텍스트 원고만 빠르게 빼고 싶어요!",
    answer: (
      <div className="space-y-1.5 text-slate-300 text-xs sm:text-sm">
        <p>물론 그렇게 하실 수 있어요! 원고 완성 속도 자체를 10배 이상 더욱 번개같이 끌어올릴 수 있는 꿀옵션이 있답니다.</p>
        <p className="leading-relaxed text-xs">
          우측 상단 입력값 항목 위를 가만히 살펴보시면 <strong className="text-amber-400">‘이미지 생성 스킵 (속도 극대화)’</strong>이라는 연두색 보조 단추가 보이실 거예요. 이 단추를 초록 불이 들어오게 활성화한 후 진행하시면, 일체의 그림 생성 로딩 대기 시간 없이 눈 깜짝할 사이에 잘 다듬어진 최고의 한글 원고만 순식간에 탄생하게 됩니다!
        </p>
      </div>
    )
  },
  {
    category: "✍️ 복사 & 발행",
    question: "완성된 예쁜 조각 글들을 내 블로그로 어떻게 안전하고 편안하게 옮기나요?",
    answer: (
      <div className="space-y-2 text-slate-300 text-xs sm:text-sm">
        <p>글을 공들여 완성하셨다면, 서식이 깨지거나 뒤섞이는 스트레스 없이 정갈하게 안방으로 가져가는 가장 편하고 안정적인 2작전이 있습니다!</p>
        <ol className="list-decimal pl-5 space-y-1 text-slate-300 text-xs text-left">
          <li><strong>초간단 ‘원고 클립보드 복사’ 이용하기:</strong> 최종 완성 화면에 크게 붙어 있는 <strong className="text-indigo-400 font-bold">📋 원고 내용 클립보드 복사</strong> 버튼을 딱 한 번 눌러보세요. 글 전체의 레이아웃과 소제목 서식이 컴퓨터에 아름답게 기억되므로, 본인의 블로그에 마우스 우클릭 후 붙여넣기(Ctrl+V) 하시면 완벽하게 배치됩니다.</li>
          <li><strong>컴퓨터에 이미지 저장한 후 수동으로 올리기:</strong> 생성된 모든 감성 일러스트와 썸네일 아래에는 <strong className="text-emerald-400 font-bold">💾 고화질 저장</strong> 버튼이 달려 있습니다. 이 버튼을 눌러 사진을 편하게 일단 저장해 두신 뒤, 내 직접 블로그 에디터의 '사진 첨부 파일 올리기' 경로로 조심성 있게 적절한 문맥 사이에 배치해 주시면 검색 상위 도달 점수가 크게 상승합니다!</li>
        </ol>
      </div>
    )
  },
  {
    category: "💰 구글 API 청구 요금",
    question: "구글 API KEY를 사용하면 구글 결제 수단으로 돈이 많이 나오나요?",
    answer: (
      <div className="space-y-1.5 text-slate-300 text-xs sm:text-sm">
        <p>모든 AI 열쇠(API Key)는 중간 수수료나 보이지 않는 플랫폼 수수료가 일절 배제된 <strong className="text-[#10b981] font-bold">구글 본사의 정품 도매 공급 원가</strong>로 요금이 책정됩니다. 일반 유료 블로그 자동 글쓰기 결제액보다 평균 100배 이상 세차게 절감되어 매우 안전하고 합리적입니다!</p>
        <div className="bg-slate-950/65 p-3.5 rounded-2xl border border-slate-800 space-y-1 font-mono text-[11px] text-slate-400 text-left">
          <div className="flex justify-between"><span className="text-slate-300">📝 원고 글 작성 (Flash 모델):</span> <span>약 0.1원 ~ 0.5원 내외 (구글 원가 기준)</span></div>
          <div className="flex justify-between"><span className="text-slate-300">🎨 본문 일러스트 생성 (장당):</span> <span>약 28원 ~ 42원 (모델 등급별 상이)</span></div>
          <div className="flex justify-between"><span className="text-slate-300">🎨 Imagen 4.0 명품 실사 그림 (장당):</span> <span>약 56원</span></div>
          <div className="border-t border-slate-800/80 my-1 pb-1 flex justify-between font-bold text-indigo-400"><span className="text-slate-300">🏆 1회 총 합계 예상 (글 1편 + 그림 4개 + 썸네일 1개):</span> <span>약 215원 안팎</span></div>
        </div>
        <p className="text-[11px] text-slate-400">화면 오른쪽 맨 위의 <strong className="text-indigo-300 font-semibold">💰 API 비용 안내</strong> 단추를 클릭해 보시면 구글 클라우드 사이트 청구서 주소와 비용 절약에 도움을 주는 특수 기법들이 더 꼼꼼히 들어있으니 궁금할 때 가볍게 살펴보세요!</p>
      </div>
    )
  },
  {
    category: "🔒 안심 보호 구역",
    question: "내 구글 API KEY와 작성한 글 내용이 유출되거나 누군가 훔쳐가지 않을까요?",
    answer: (
      <div className="space-y-1.5 text-slate-300 text-xs sm:text-sm">
        <p><strong>하늘을 우러러 단 1글자나 비밀키 코드 한 자락조차 다른 인터넷 데이터베이스나 개발자의 서버에 무단 수집되는 일이 전혀 없음을 투명하게 밝힙니다!</strong></p>
        <p className="leading-relaxed text-xs">
          저희 혁신 블로그 도우미 앱은 완전한 개인정보 보호 원칙으로 제작되었습니다. 입력해주신 모든 구글 API KEY와 글쓰기 작업 데이터는 개발자의 서버를 거치지 않고, <strong className="text-indigo-400">오직 회원님 개인 컴퓨터나 스마트폰 인터넷 저장소(localStorage)</strong>에 암호화되어 안전히 임시 저장됩니다. 글을 완성하는 순간에도 오직 구글 크라우드 서버와 암호화 통로로만 신속하게 통신하니 기밀성 걱정 없이 안전하게 안심하고 이용하셔도 괜찮습니다.
        </p>
      </div>
    )
  },
  {
    category: "🎓 마스터 지름길",
    question: "더욱 생동감 넘치고 자연스러운 글을 완성하는 비법이 있다면요?",
    answer: (
      <div className="space-y-2 text-slate-300 text-xs sm:text-sm">
        <p>마치 진짜 파워블로거가 하루 종일 정성 들여 키보드를 두드린 것 같은 환상적인 감성을 내기 딱 좋은 꿀팁 두 가지만 챙기세요!</p>
        <ul className="list-disc pl-5 space-y-1 text-slate-300 text-xs text-left">
          <li><strong>목차 편집에서 내 진짜 말투 한 꼬집 얹기:</strong> 3단계인 목차가 나왔을 때 마우스를 조심스레 올려 내 맘대로 하고픈 이야기를 덧붙여 더 자유롭게 다듬고 승인해 보세요. AI가 더욱 구체적인 진짜 나의 에피소드라 여기고 글의 깊이를 무한대로 확장합니다.</li>
          <li><strong>내가 직접 폰으로 촬영한 실제 자연광 사진 섞기:</strong> AI가 그린 감성 충만한 고화질 대표 썸네일을 블로그 메인으로 자랑스럽게 걸어 시선을 사로잡은 뒤, 중간중간 들어갈 리얼 맛집 음식 구도나 매장 카운터 전경 같은 건 본인이 찍은 실제 일상 스냅 사진으로 채워 보세요. 정보 신뢰도가 200% 배가되어 댓글 창에 하트와 이웃 신청이 우르르 쏟아질 거예요!</li>
        </ul>
      </div>
    )
  },
  {
    category: "🔍 왕초보 상식",
    question: "블로그 키울 때 핵심이라는 ‘SEO’와 ‘GEO’가 각각 무슨 뜻인가요?",
    answer: (
      <div className="space-y-2 text-slate-300 text-xs sm:text-sm">
        <p>어려운 영어 약자 같지만, 원리만 알면 초등학생도 이해할 수 있을 만큼 아주 간단한 뜻이랍니다!</p>
        <div className="space-y-2.5">
          <div>
            <strong className="text-emerald-400 font-bold">1. SEO (검색창 최적화 - Search Engine Optimization):</strong>
            <p className="text-xs text-slate-400 leading-relaxed mt-0.5">
              사람들이 네이버나 구글 검색창에 특정 단어로 검색했을 때, 내 글이 1페이지 맨 위에 짠! 하고 나타나도록 글을 알맞게 잘 다듬는 과정이에요. 사람들이 가장 궁금해할 핵심 정보와 인기 키워드를 본문에 자연스럽게 잘 담아두는 것이 최고 비결이랍니다.
            </p>
          </div>
          <div>
            <strong className="text-indigo-400 font-bold">2. GEO (AI 답변 최적화 - Generative Engine Optimization):</strong>
            <p className="text-xs text-slate-400 leading-relaxed mt-0.5">
              요즘은 소비자들이 직접 네이버나 구글 창에 검색하지 않고, 챗GPT나 제미나이 같은 인공지능(AI)에게 <em className="text-slate-200">“서울 역삼동에서 가장 유명한 파스타 데이트 맛집 알려줘”</em> 하고 직접 물어봅니다. 이때 인공지능 비서가 수많은 웹페이지 중 내 블로그 글을 직접 콕 집어 읽은 뒤, <em className="text-slate-200 font-semibold font-mono font-normal">“블로거 아무개 님 글에 따르면 이곳이 최고입니다”</em> 하고 내 글을 인용하도록 유도하는 최첨단 스마트한 글쓰기 비법입니다!
            </p>
          </div>
        </div>
      </div>
    )
  },
  {
    category: "🏆 노출의 비결",
    question: "이런 최적화 작업이 블로그 방문객 증가에 왜 꼭 필요한가요?",
    answer: (
      <div className="space-y-2 text-slate-300 text-xs sm:text-sm">
        <p>열심히 공들여 쓴 자식 같은 내 글이 남들에게 전혀 읽히지 않고 인터넷 바다 속으로 그냥 조용히 묻혀버린다면 너무 가슴 아프겠죠? 이 최적화 기술들이 꼭 필요한 3가지 강력한 이유를 말씀드릴게요!</p>
        <ul className="list-disc pl-5 space-y-1.5 text-slate-400 text-xs text-left">
          <li>
            <strong className="text-slate-200">새롭게 바뀌는 AI 길목을 선점합니다:</strong> 요즘 트렌디하고 스마트한 소비자들은 광고 느낌이 가득한 글들을 여러 개 일일이 클릭하는 번거로움보다, 인공지능이 정교하게 요약해 주는 AI 추천 답변을 훨씬 더 깊이 신뢰합니다. 남들보다 한 발 앞서 GEO 글쓰기를 적용해두면, 새롭게 커지는 인공지능 답변 노선에 내 글을 맨 먼저 얹을 수 있습니다.
          </li>
          <li>
            <strong className="text-slate-200">검색 로봇과 인공지능이 사랑하는 양질의 원고가 됩니다:</strong> 구글과 네이버 검색 로봇, 그리고 똑똑한 AI 추천 엔진들은 실제 사용자의 생생한 방문 기록과 가치 있는 정보가 풍부한 글을 우선적으로 ‘모범 참고 글’ 삼아 수집해 갑니다. 비결에 맞게 글을 이쁘게 다듬어 두면 양대 검색 엔진 모두에게 최상위 점수를 받게 됩니다.
          </li>
          <li>
            <strong className="text-slate-200">글 한 편이 매일 24시간 일하는 영리한 홍보사원이 됩니다:</strong> 정성껏 최적화를 입혀 놓은 글 한 편은, 우리가 곤히 잠든 새벽이나 일상을 보내는 낮 시간 동안에도 네이버 검색 영역과 챗봇 답변 영역 양쪽에서 매일 수천 명의 새 이웃을 내 블로그로 안내하는 가성비 최고의 마케터가 되어 줍니다!
          </li>
        </ul>
      </div>
    )
  },
  {
    category: "📈 승인 패스트트랙",
    question: "혁신 블로그 AI로 네이버 애드포스트, 구글 애드센스 승인을 더 빨리 통과하는 특급 비결이 있나요?",
    answer: (
      <div className="space-y-2 text-slate-300 text-xs sm:text-sm">
        <p>네, 당연히 있습니다! 애드포스트(네이버 광고 수익)와 애드센스(구글 고수익 돈벌이 광고) 심사는 마치 점잖은 교수님께 정성스러운 리포트를 제출하는 것과 같아요. 승인을 남들보다 배 이상 엄청나게 앞당기는 <strong className="text-amber-400 font-bold">4단계 특급 꿀팁 로드맵</strong>을 꼭 따라해 보세요!</p>
        <ul className="list-disc pl-5 space-y-2 text-slate-300 text-xs text-left">
          <li>
            <strong className="text-slate-100">1단계: 정보가 촘촘하고 전문적인 분야를 겨냥하세요</strong>
            <p className="text-slate-400 pl-4 mt-0.5 leading-relaxed">
              심사관 로봇들은 단순히 일상을 짧게 끄적인 글보다 ‘하나의 명쾌한 지식을 길게 탐구한 전문성 있는 글’을 매우 아끼고 사랑합니다. 맛집의 상세한 기본정보/메뉴판 분석, 책의 핵심 가치 서평, IT 기기의 세부 스펙 분석 등을 위주로 원고를 꾸준히 축적하세요.
            </p>
          </li>
          <li>
            <strong className="text-slate-100">2단계: 글자 수를 기본 1,500 ~ 2,000자 안팎으로 묵직하게 뽑으세요</strong>
            <p className="text-slate-400 pl-4 mt-0.5 leading-relaxed">
              구글 애드센스는 글이 너무 짧으면 가치가 없다고 판정해 퇴짜를 놓습니다. 3단계 목차(글의 차례) 조율 과정에서, AI가 조립해 준 목차에 <em className="text-indigo-400">“이것만큼은 알아두세요”</em> 라든지 <em className="text-indigo-400">“추천 대상 및 주의점”</em> 같은 부가 목차를 마우스로 가볍게 한 줄씩 더 적어주어 꽉 찬 고밀도 장문 원고를 알차게 얻어내세요.
            </p>
          </li>
          <li>
            <strong className="text-slate-100">3단계: 나만의 솔직한 경험과 소감을 한 줄 꼭 끼워 넣으세요</strong>
            <p className="text-slate-400 pl-4 mt-0.5 leading-relaxed">
              글 서두나 맺음말 영역 사이에 <em className="text-[#10b981]">“저는 평소 이 제품을 쓸 때 이런 점이 만족스러웠는데요.”</em> 혹은 <em className="text-[#10b981]">“방문했을 당시에 직원들의 환한 다정함 덕분에 기분까지 화사해졌던 기억이 선합니다.”</em> 처럼 본인의 작은 실제 이야기나 주관적인 생각 한 조각을 꼭 덧붙여 보세요. 유사 문서 추적 망을 깨끗이 피하는 비법입니다.
            </p>
          </li>
          <li>
            <strong className="text-slate-100">4단계: 하루 1~2개씩 2주 동안 꾸준히 예약 발행을 돌려 두세요</strong>
            <p className="text-slate-400 pl-4 mt-0.5 leading-relaxed">
              동일한 시간대에 끊김 없이 성실하게 올라오는 블로그를 두 플랫폼 모두 1순위 우량 상위 등급으로 믿고 채택합니다. 우리 도우미로 10~20편의 알토란 같은 명품 원고를 미리 넉넉히 수거해 둔 뒤, 매월 일정한 시각에 예약 업로드되도록 예약을 설정하시면 누구나 단번에 프리패스로 합격 도장을 받아내실 수 있습니다!
            </p>
          </li>
        </ul>
      </div>
    )
  }
];

export const FaqModal: React.FC<FaqModalProps> = ({ isOpen, onClose }) => {
  const [openIndexes, setOpenIndexes] = useState<Record<number, boolean>>({});

  const toggleIndex = (idx: number) => {
    setOpenIndexes((prev) => ({
      ...prev,
      [idx]: !prev[idx]
    }));
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div 
        id="faq-modal-overlay"
        className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md"
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-2xl overflow-hidden shadow-2xl flex flex-col max-h-[85vh]"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="p-6 border-b border-slate-800 bg-slate-900/50 flex justify-between items-center">
            <div className="flex items-center gap-3">
              <span className="text-2xl">❓</span>
              <div>
                <h3 className="text-xl font-bold text-white tracking-tight">초보자를 위한 자주 묻는 질문 FAQ</h3>
                <p className="text-xs text-slate-400 mt-0.5">혁신 블로그 AI의 핵심 비급과 스마트한 사용 팁을 전해드려요.</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-white hover:bg-slate-800 p-2 rounded-xl transition-all"
            >
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Body */}
          <div className="p-6 overflow-y-auto space-y-4 max-h-[60vh] custom-scrollbar">
            {FAQ_ITEMS.map((item, idx) => {
              const iconOpen = openIndexes[idx];
              return (
                <div 
                  key={idx} 
                  className={`border rounded-2xl transition-all duration-300 ${
                    iconOpen 
                      ? 'bg-slate-950/60 border-indigo-500/40 shadow-lg shadow-indigo-500/5' 
                      : 'bg-slate-900 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <button
                    onClick={() => toggleIndex(idx)}
                    type="button"
                    className="w-full text-left p-5 flex items-center justify-between gap-4 font-bold text-slate-200 hover:text-white"
                  >
                    <div className="flex flex-col gap-1.5 items-start">
                      <span className="text-[10px] uppercase font-black tracking-wider text-indigo-400 px-2 py-0.5 rounded-md bg-indigo-950/40 border border-indigo-900/40">
                        {item.category}
                      </span>
                      <span className="text-sm sm:text-base leading-snug">{item.question}</span>
                    </div>
                    <span className={`transform transition-transform duration-300 bg-slate-800 hover:bg-indigo-600 border border-slate-700 flex items-center justify-center rounded-full w-8 h-8 shrink-0 text-xs ${iconOpen ? 'rotate-180 bg-indigo-600 border-indigo-500 text-white' : 'text-slate-400'}`}>
                      ▼
                    </span>
                  </button>
                  <AnimatePresence>
                    {iconOpen && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.25 }}
                        className="overflow-hidden"
                      >
                        <div className="px-5 pb-5 pt-1 text-slate-300 text-sm leading-relaxed border-t border-slate-800/40 mt-1">
                          {item.answer}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              );
            })}
          </div>

          {/* Footer */}
          <div className="p-5 border-t border-slate-800/60 bg-slate-950/40 flex justify-between items-center">
            <span className="text-xs text-slate-500 font-mono">Developer : 정혁신 | 플랫폼 버전: v1.2</span>
            <button
              onClick={onClose}
              className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-black shadow-md transition-colors"
            >
              닫기
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
