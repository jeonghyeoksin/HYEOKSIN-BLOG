import React, { useState } from 'react';
import { generateBlogIdeas } from '../services/geminiService';

const IdeaGenerator: React.FC = () => {
  const [niche, setNiche] = useState('');
  const [ideas, setIdeas] = useState('');
  const [loading, setLoading] = useState(false);

  const handleGenerate = async () => {
    if (!niche) return;
    setLoading(true);
    try {
      const result = await generateBlogIdeas(niche);
      setIdeas(result);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-8">
      <h2 className="text-3xl font-bold text-slate-800 mb-6">아이디어 브레인스토밍 💡</h2>
      <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-100 mb-8">
        <label className="block text-sm font-medium text-slate-700 mb-2">블로그 카테고리 / 관심 분야</label>
        <div className="flex gap-4">
          <input 
            type="text" 
            value={niche}
            onChange={(e) => setNiche(e.target.value)}
            placeholder="예: 캠핑 요리, 파이썬 코딩, 재테크"
            className="flex-1 p-4 rounded-xl border border-slate-200 focus:ring-2 focus:ring-purple-500 outline-none"
          />
          <button 
            onClick={handleGenerate}
            disabled={loading || !niche}
            className="bg-purple-600 text-white px-8 py-4 rounded-xl font-medium hover:bg-purple-700 disabled:bg-slate-300 transition-colors"
          >
            {loading ? '생성 중...' : '아이디어 얻기'}
          </button>
        </div>
      </div>

      {ideas && (
        <div className="bg-white p-8 rounded-2xl shadow-lg border border-purple-100 animate-fade-in-up">
          <h3 className="text-lg font-bold text-slate-800 mb-4 border-b border-slate-100 pb-2">Gemini의 제안</h3>
          <div className="prose prose-slate max-w-none whitespace-pre-wrap text-slate-700 leading-relaxed">
            {ideas}
          </div>
        </div>
      )}
    </div>
  );
};

export default IdeaGenerator;
