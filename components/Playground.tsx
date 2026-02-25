import React, { useState } from 'react';
import { GoogleGenAI } from "@google/genai";
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

const Playground: React.FC = () => {
  const [prompt, setPrompt] = useState('');
  const [result, setResult] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleGenerate = async () => {
    if (!prompt.trim()) return;

    setIsLoading(true);
    setError(null);
    setResult('');

    try {
      const apiKey = process.env.API_KEY;
      if (!apiKey) {
        throw new Error("API 키가 설정되지 않았습니다. 상단 'API Key 설정' 버튼을 이용해 주세요.");
      }

      const ai = new GoogleGenAI({ apiKey });
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: prompt,
      });

      setResult(response.text || "응답을 생성할 수 없습니다.");
    } catch (err: any) {
      console.error("Playground error:", err);
      setError(err.message || "알 수 없는 오류가 발생했습니다.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-fade-in">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-8 shadow-xl">
        <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-3">
          <span className="text-3xl">🧪</span> Gemini Playground
        </h2>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-400 mb-2">질문 입력</label>
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="Gemini에게 무엇이든 물어보세요..."
              className="w-full h-40 p-4 bg-slate-800 border border-slate-700 rounded-2xl text-white placeholder-slate-500 focus:ring-2 focus:ring-indigo-500 outline-none transition-all resize-none"
            />
          </div>

          <button
            onClick={handleGenerate}
            disabled={isLoading || !prompt.trim()}
            className={`w-full py-4 rounded-2xl font-bold text-lg transition-all shadow-lg flex items-center justify-center gap-3 ${
              isLoading || !prompt.trim()
                ? 'bg-slate-800 text-slate-500 cursor-not-allowed'
                : 'bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white shadow-indigo-500/20 active:scale-[0.98]'
            }`}
          >
            {isLoading ? (
              <>
                <div className="w-5 h-5 border-3 border-white/30 border-t-white rounded-full animate-spin" />
                생성 중...
              </>
            ) : (
              <><span>✨</span> 답변 생성하기</>
            )}
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-rose-500/10 border border-rose-500/20 p-6 rounded-2xl text-rose-400 flex gap-4 animate-in fade-in slide-in-from-top-4">
          <span className="text-xl">⚠️</span>
          <p>{error}</p>
        </div>
      )}

      {result && (
        <div className="bg-white rounded-3xl p-8 shadow-2xl border border-slate-200 animate-in fade-in slide-in-from-top-4">
          <div className="flex items-center justify-between mb-6 pb-4 border-b border-slate-100">
            <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <span className="text-xl">📝</span> 생성 결과
            </h3>
            <button 
              onClick={() => {
                navigator.clipboard.writeText(result);
                alert('클립보드에 복사되었습니다.');
              }}
              className="text-xs font-semibold text-indigo-600 hover:text-indigo-700 px-3 py-1 rounded-lg bg-indigo-50 hover:bg-indigo-100 transition-colors"
            >
              복사하기
            </button>
          </div>
          <div className="markdown-body prose prose-slate max-w-none">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>
              {result}
            </ReactMarkdown>
          </div>
        </div>
      )}
    </div>
  );
};

export default Playground;
