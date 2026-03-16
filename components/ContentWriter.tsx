import React, { useState, useRef, useEffect, useMemo } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { marked } from 'marked';
import { 
  suggestRelatedKeywords, 
  generateOutline, 
  generateFullPostStream, 
  generateImagePromptsForPost, 
  generateThumbnailPrompt, 
  generateBlogImage,
  generateTitle,
  generateUSP,
  ImagePromptRequest
} from '../services/geminiService';
import { StudioStep, GeneratedImage, KeywordSuggestion } from '../types';

const steps: { id: StudioStep; label: string; icon: string }[] = [
  { id: 'keyword', label: '키워드 발굴', icon: '🔍' },
  { id: 'script', label: '대본 생성', icon: '📝' },
  { id: 'images', label: '이미지 자동생성', icon: '🖼️' },
  { id: 'thumbnail', label: '1:1 썸네일', icon: '🎨' },
  { id: 'result', label: '최종 결과', icon: '🏆' },
];

export const ContentWriter: React.FC = () => {
  // --- State: Inputs ---
  const [topic, setTopic] = useState('');
  const [storeName, setStoreName] = useState('');
  const [salesService, setSalesService] = useState('');
  const [postGoal, setPostGoal] = useState(''); // USP / Goal
  const [referenceNote, setReferenceNote] = useState('');
  const [benchmarkingText, setBenchmarkingText] = useState('');
  
  // --- State: Files ---
  const [referenceFile, setReferenceFile] = useState<File | null>(null); // Text context file
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [faceImageFile, setFaceImageFile] = useState<File | null>(null);
  const [contextImageFiles, setContextImageFiles] = useState<File[]>([]); // General references
  const [copyImageFiles, setCopyImageFiles] = useState<File[]>([]); // Images to be placed in the post

  // --- State: Process ---
  const [currentStep, setCurrentStep] = useState<StudioStep>('keyword');
  const [keywords, setKeywords] = useState<KeywordSuggestion[]>([]);
  const [selectedKeyword, setSelectedKeyword] = useState('');
  const [manualKeyword, setManualKeyword] = useState('');
  const [isAutoRunning, setIsAutoRunning] = useState(false);
  
  // --- State: Generation Results ---
  const [title, setTitle] = useState('');
  const [outline, setOutline] = useState('');
  const [content, setContent] = useState('');
  const [generatedImages, setGeneratedImages] = useState<GeneratedImage[]>([]);
  const [thumbnailPrompt, setThumbnailPrompt] = useState('');
  const [thumbnail, setThumbnail] = useState<string | null>(null);
  const [editingImageIndex, setEditingImageIndex] = useState<number | null>(null); // null for none, -1 for thumbnail, 0+ for generatedImages
  const [editPrompt, setEditPrompt] = useState('');
  const [isRegenerating, setIsRegenerating] = useState(false);
  
  // --- State: UI Flags ---
  const [isGenerating, setIsGenerating] = useState(false);
  const [isGeneratingUSP, setIsGeneratingUSP] = useState(false);
  const [imageCount, setImageCount] = useState<number>(4);
  const [isAutoImageCount, setIsAutoImageCount] = useState<boolean>(true);
  
  // --- Refs ---
  const resultContentRef = useRef<HTMLDivElement>(null);

  // --- Helpers ---
  const checkAndRequireApiKey = async (): Promise<boolean> => {
    if (typeof window !== 'undefined' && (window as any).aistudio) {
        try {
            const hasKey = await (window as any).aistudio.hasSelectedApiKey();
            if (!hasKey) {
                const success = await (window as any).aistudio.openSelectKey();
                return success;
            }
            return true;
        } catch (e) {
            console.error("API Key Check Failed", e);
            return false;
        }
    }
    return true;
  };

  const convertFileToBase64 = (file: File): Promise<{ data: string; mimeType: string }> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => {
            const result = reader.result as string;
            const base64Data = result.split(',')[1];
            
            let mimeType = file.type;
            if (!mimeType) {
                const ext = file.name.split('.').pop()?.toLowerCase();
                if (ext === 'md') mimeType = 'text/markdown';
                else if (ext === 'txt') mimeType = 'text/plain';
                else mimeType = 'application/octet-stream';
            }
            resolve({ data: base64Data, mimeType });
        };
        reader.onerror = reject;
        reader.readAsDataURL(file);
    });
  };

  const getImageRefs = async () => {
    const refs: { data: string, mimeType: string }[] = [];
    if (logoFile) refs.push(await convertFileToBase64(logoFile));
    for (const file of contextImageFiles) {
        refs.push(await convertFileToBase64(file));
    }
    return refs;
  };

  const getFaceRef = async () => {
      if (faceImageFile) return await convertFileToBase64(faceImageFile);
      return undefined;
  };

  // --- Automatic Workflow ---
  const runAutomationSequence = async (keyword: string) => {
    if (!keyword) return;
    setIsAutoRunning(true);
    setSelectedKeyword(keyword);

    try {
        // --- Step 1: Script ---
        setCurrentStep('script');
        
        let filePart = referenceFile ? await convertFileToBase64(referenceFile) : undefined;
        
        // Generate Title
        const generatedTitle = await generateTitle(keyword, topic || keyword, postGoal, referenceNote);
        setTitle(generatedTitle);

        // Generate Outline
        const scriptImageParts = [];
        for (const file of contextImageFiles) {
             scriptImageParts.push(await convertFileToBase64(file));
        }

        const outlineRes = await generateOutline(
            keyword, storeName, salesService, postGoal, filePart, undefined, benchmarkingText, referenceNote, scriptImageParts, copyImageFiles.length
        );
        setOutline(outlineRes);

        // Generate Content
        let accumulatedContent = '';
        setContent('');
        await generateFullPostStream(
            keyword, outlineRes, storeName, salesService, postGoal, 
            (chunk) => {
                accumulatedContent += chunk;
                setContent(prev => prev + chunk);
            }, 
            undefined, benchmarkingText, referenceNote, scriptImageParts, copyImageFiles.length
        );

        // --- Step 2: Images ---
        if (copyImageFiles.length > 0) {
            // Skip AI image generation if copy images are provided
            setGeneratedImages([]);
            setThumbnail(null);
            setThumbnailPrompt('');
            setCurrentStep('result');
            setIsAutoRunning(false);
            return;
        }

        setCurrentStep('images');
        
        const hasKey = await checkAndRequireApiKey();
        if (!hasKey) {
            alert("이미지 생성을 위해 API 키 선택이 필요합니다. 자동화를 중단합니다.");
            setIsAutoRunning(false);
            return;
        }

        const facePart = await getFaceRef();
        const refParts = await getImageRefs();

        const finalImageCount = isAutoImageCount ? 0 : imageCount;
        const prompts = await generateImagePromptsForPost(accumulatedContent, !!facePart, finalImageCount, refParts.length > 0);
        
        const placeholders: GeneratedImage[] = prompts.map(p => ({
            prompt: p.prompt,
            context: p.context,
            url: null,
            isLoading: true
        }));
        setGeneratedImages(placeholders);

        // Run image generation
        await Promise.all(placeholders.map(async (item, index) => {
            try {
                const url = await generateBlogImage(item.prompt, "16:9", refParts, facePart);
                setGeneratedImages(prev => {
                    const newArr = [...prev];
                    newArr[index] = { ...newArr[index], url, isLoading: false };
                    return newArr;
                });
            } catch (e) {
                console.error(`Image ${index} failed`, e);
                setGeneratedImages(prev => {
                    const newArr = [...prev];
                    newArr[index] = { ...newArr[index], isLoading: false };
                    return newArr;
                });
            }
        }));

        // --- Step 3: Thumbnail ---
        setCurrentStep('thumbnail');
        const thumbPrompt = await generateThumbnailPrompt(keyword, accumulatedContent);
        setThumbnailPrompt(thumbPrompt);
        
        const thumbUrl = await generateBlogImage(thumbPrompt, "1:1", refParts, facePart);
        setThumbnail(thumbUrl);

        // --- Step 4: Result ---
        setCurrentStep('result');

    } catch (e) {
        console.error("Automation Error", e);
        alert("작업 중 오류가 발생했습니다.");
    } finally {
        setIsAutoRunning(false);
    }
  };

  // --- Handlers ---
  const handleGenerateUSP = async () => {
      if (!topic || !storeName || !salesService) {
          alert('주제, 상호명, 판매 서비스를 모두 입력해주세요.');
          return;
      }
      setIsGeneratingUSP(true);
      try {
          const usp = await generateUSP(topic, storeName, salesService);
          setPostGoal(usp);
      } catch (e) {
          console.error(e);
          alert('USP 도출 중 오류가 발생했습니다.');
      } finally {
          setIsGeneratingUSP(false);
      }
  };

  const handleDiscoverKeywords = async () => {
    if (!topic) return;
    setIsGenerating(true);
    try {
      let filePart = referenceFile ? await convertFileToBase64(referenceFile) : undefined;
      const results = await suggestRelatedKeywords(topic, storeName, salesService, postGoal, filePart, referenceNote);
      setKeywords(results);
    } catch (error) {
      console.error(error);
      alert("키워드 추천 실패");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleManualStart = () => {
    if (!manualKeyword.trim()) return;
    if (!topic) setTopic(manualKeyword);
    runAutomationSequence(manualKeyword);
  };

  const handleBackStep = () => {
      // In auto mode, stepping back is less common, but we'll allow basic navigation if not running
      if (isAutoRunning) return;
      const stepOrder: StudioStep[] = ['keyword', 'script', 'images', 'thumbnail', 'result'];
      const currentIdx = stepOrder.indexOf(currentStep);
      if (currentIdx > 0) setCurrentStep(stepOrder[currentIdx - 1]);
  };

  const handleRegenerateImage = async () => {
    if (editingImageIndex === null) return;
    setIsRegenerating(true);
    try {
        const facePart = await getFaceRef();
        const refParts = await getImageRefs();
        const ratio = editingImageIndex === -1 ? "1:1" : "16:9";
        
        const newUrl = await generateBlogImage(editPrompt, ratio, refParts, facePart);
        
        if (editingImageIndex === -1) {
            setThumbnail(newUrl);
            setThumbnailPrompt(editPrompt);
        } else {
            setGeneratedImages(prev => {
                const newArr = [...prev];
                newArr[editingImageIndex] = { ...newArr[editingImageIndex], url: newUrl, prompt: editPrompt };
                return newArr;
            });
        }
        setEditingImageIndex(null);
    } catch (e) {
        console.error("Regeneration failed", e);
        alert("이미지 수정 중 오류가 발생했습니다.");
    } finally {
        setIsRegenerating(false);
    }
  };

  const handleContextImagesChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
        const filesArray = Array.from(e.target.files);
        setContextImageFiles(prev => [...prev, ...filesArray].slice(0, 50));
    }
  };

  const handleCopyImagesChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
        const filesArray = Array.from(e.target.files);
        setCopyImageFiles(prev => [...prev, ...filesArray].slice(0, 50));
    }
  };

  const copyToClipboard = (text: string) => {
      navigator.clipboard.writeText(text);
      alert('클립보드에 복사되었습니다.');
  };

  // --- HTML Conversion & Copy ---
  const handleCopyHtml = async () => {
    if (!content) return;

    let processed = content;

    // Custom formatting rule application BEFORE marked processing
    processed = processed.replace(/\*\*\*(.*?)\*\*\*/g, '<span style="background-color: #fef08a; color: #dc2626;">$1</span>');
    processed = processed.replace(/\*\*(.*?)\*\*/g, '<span style="color: #dc2626;">$1</span>');
    processed = processed.replace(/`(.*?)`/g, '<span style="background-color: #fef08a; color: #2563eb;">$1</span>');
    processed = processed.replace(/\*(.*?)\*/g, '<span style="color: #2563eb;">$1</span>');

    // Parse markdown to HTML (handles tables, lists, etc.)
    const htmlContent = marked.parse(processed) as string;

    // Apply inline styles to Tables and Blockquotes (Citations) for clipboard compatibility
    const styledHtml = htmlContent
        // Table Styles
        .replace(/<table>/g, '<table style="border-collapse: collapse; width: 100%; border: 1px solid #cbd5e1; margin: 20px 0;">')
        .replace(/<th>/g, '<th style="border: 1px solid #cbd5e1; padding: 12px; background-color: #f1f5f9; font-weight: bold; text-align: left; color: #0f172a;">')
        .replace(/<td>/g, '<td style="border: 1px solid #cbd5e1; padding: 12px; color: #1f2937;">')
        // Blockquote (Citation) Styles - Blue bar on left, light blue background
        .replace(/<blockquote>/g, '<blockquote style="border-left: 8px solid #2563eb; background-color: #eff6ff; padding: 20px; margin: 30px 0; border-top-right-radius: 12px; border-bottom-right-radius: 12px; color: #1e40af; font-weight: 800; font-size: 1.2em; box-shadow: 0 2px 4px rgba(37, 99, 235, 0.05);">')
        // Paragraph Styles: Force explicit margin/spacing for "double line break" visual effect
        .replace(/<p>/g, '<p style="margin-bottom: 24px; line-height: 1.8;">');

    const blob = new Blob([styledHtml], { type: 'text/html' });
    const textBlob = new Blob([styledHtml], { type: 'text/plain' });
    
    try {
        await navigator.clipboard.write([
            new ClipboardItem({ 
                'text/html': blob,
                'text/plain': textBlob 
            })
        ]);
        alert('본문이 HTML 형식(인용구/표/문단간격 포함)으로 복사되었습니다.\n블로그 에디터에 붙여넣으세요.');
    } catch (err) {
        console.error('Clipboard write failed', err);
        alert('복사에 실패했습니다. 브라우저 권한을 확인해주세요.');
    }
  };

  // --- Image Download (Individual PNG Loop) ---
  const downloadAllImagesAsPng = async () => {
      const imagesToDownload: { url: string, name: string }[] = [];
      
      // Collect all images
      if (copyImageFiles.length > 0) {
          copyImageFiles.forEach((file, idx) => {
              imagesToDownload.push({ url: URL.createObjectURL(file), name: file.name });
          });
      } else {
          if (thumbnail) imagesToDownload.push({ url: thumbnail, name: 'thumbnail.png' });
          generatedImages.forEach((img, idx) => {
              if (img.url) imagesToDownload.push({ url: img.url, name: `image_${idx + 1}.png` });
          });
      }

      if (imagesToDownload.length === 0) {
          alert("다운로드할 이미지가 없습니다.");
          return;
      }

      // Loop and download with delay to prevent browser blocking
      let count = 0;
      for (const img of imagesToDownload) {
          const link = document.createElement('a');
          link.href = img.url;
          link.download = img.name;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          
          count++;
          // Small delay is crucial for multiple file downloads
          if (count < imagesToDownload.length) {
              await new Promise(resolve => setTimeout(resolve, 500));
          }
      }
  };

  // --- Render Helpers ---
  const renderStepIndicator = () => (
    <div className="flex items-center justify-between mb-8 px-4 max-w-5xl mx-auto">
      {steps.map((s, idx) => {
        const isActive = s.id === currentStep;
        const isPast = steps.findIndex(x => x.id === currentStep) > idx;
        const isProcessing = isAutoRunning && isActive;

        return (
          <div key={s.id} className="flex flex-col items-center relative z-10 flex-1">
            <div 
              className={`w-12 h-12 rounded-full flex items-center justify-center text-xl transition-all duration-300 border-2 
                ${isActive ? 'bg-indigo-600 text-white border-indigo-500 scale-110 shadow-lg shadow-indigo-500/30' : 
                  isPast ? 'bg-emerald-600 text-white border-emerald-500' : 'bg-slate-800 text-slate-500 border-slate-700'}`}
            >
              {isProcessing ? (
                  <span className="animate-spin text-xl">⚡️</span>
              ) : isPast ? (
                  '✓' 
              ) : (
                  s.icon
              )}
            </div>
            <span className={`mt-2 text-xs font-medium ${isActive ? 'text-indigo-400' : isPast ? 'text-emerald-400' : 'text-slate-500'} ${isProcessing ? 'animate-pulse' : ''}`}>
              {s.label}
            </span>
            {idx < steps.length - 1 && (
                <div className={`absolute top-6 left-[60%] w-[80%] h-0.5 -z-10 ${isPast ? 'bg-emerald-600' : 'bg-slate-700'}`} />
            )}
          </div>
        );
      })}
    </div>
  );

  return (
    <div className="flex flex-col h-full bg-slate-950 overflow-hidden">
        {/* Step Header */}
        <div className="bg-slate-900 border-b border-slate-800 pt-8 pb-4 shadow-sm z-20 flex-none">
            {currentStep !== 'keyword' && !isAutoRunning && (
                <button 
                    onClick={handleBackStep}
                    className="absolute left-8 top-8 text-slate-400 hover:text-white flex items-center gap-2 text-sm font-medium bg-slate-800 px-3 py-1.5 rounded-lg border border-slate-700"
                >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
                    이전
                </button>
            )}
            {renderStepIndicator()}
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-8">
            <div className="max-w-6xl mx-auto min-h-[600px] flex flex-col">
                
                {/* Step 1: Keyword & Inputs */}
                {currentStep === 'keyword' && (
                  <div className="space-y-10 pb-24 animate-fade-in">
                    <div className="text-center space-y-4">
                        <h2 className="text-3xl font-bold text-white">키워드 발굴 & 전략 수립</h2>
                        <p className="text-slate-400">어떤 주제로 포스팅을 작성할까요?</p>
                    </div>

                    <div className="bg-slate-900/50 p-8 rounded-3xl border border-slate-800 space-y-6 shadow-xl backdrop-blur-sm">
                        {/* Topic Input */}
                        <div className="space-y-2">
                            <label className="text-sm font-bold text-slate-300 ml-1">블로그 주제 (핵심 토픽) <span className="text-red-500">*</span></label>
                            <input 
                                type="text" 
                                value={topic}
                                onChange={(e) => setTopic(e.target.value)}
                                placeholder="예: 서울 실내 데이트 추천, 아이폰 16 리뷰"
                                className="w-full p-4 rounded-xl bg-slate-800 border border-slate-700 focus:ring-2 focus:ring-indigo-500 outline-none text-white text-lg shadow-inner"
                            />
                        </div>

                        {/* Store & Service Inputs */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <label className="text-sm font-bold text-slate-300 ml-1">상호명 / 브랜드명</label>
                                <input 
                                    type="text" 
                                    value={storeName}
                                    onChange={(e) => setStoreName(e.target.value)}
                                    placeholder="예: 스타벅스 강남점"
                                    className="w-full p-3 rounded-xl bg-slate-800 border border-slate-700 focus:ring-2 focus:ring-indigo-500 outline-none text-white"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-bold text-slate-300 ml-1">판매 제품 / 서비스</label>
                                <input 
                                    type="text" 
                                    value={salesService}
                                    onChange={(e) => setSalesService(e.target.value)}
                                    placeholder="예: 아메리카노, 시즌 한정 케이크"
                                    className="w-full p-3 rounded-xl bg-slate-800 border border-slate-700 focus:ring-2 focus:ring-indigo-500 outline-none text-white"
                                />
                            </div>
                        </div>

                        {/* USP Section */}
                        <div className="space-y-2">
                            <label className="text-sm font-bold text-slate-300 ml-1">포스팅 목표 (USP) - <span className="text-indigo-400">AI 자동 도출 가능</span></label>
                            <div className="flex gap-3">
                                <input 
                                    type="text" 
                                    value={postGoal}
                                    onChange={(e) => setPostGoal(e.target.value)}
                                    placeholder="직접 입력하거나 우측 버튼으로 자동 생성하세요."
                                    className="flex-1 p-3 rounded-xl bg-slate-800 border border-slate-700 focus:ring-2 focus:ring-indigo-500 outline-none text-white"
                                />
                                <button 
                                    onClick={handleGenerateUSP}
                                    disabled={isGeneratingUSP || !topic}
                                    className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-bold transition-all shadow-lg shadow-indigo-500/20 whitespace-nowrap flex items-center gap-2 disabled:opacity-50"
                                >
                                    {isGeneratingUSP ? <span className="animate-spin">🌀</span> : '🎯 USP 자동 도출'}
                                </button>
                            </div>
                        </div>

                        {/* Reference Note */}
                        <div className="space-y-2">
                            <label className="text-sm font-bold text-slate-300 ml-1">참고 노트 (선택)</label>
                            <textarea 
                                value={referenceNote}
                                onChange={(e) => setReferenceNote(e.target.value)}
                                placeholder="추가적인 요청사항이나 참고할 내용을 입력하세요."
                                className="w-full p-3 rounded-xl bg-slate-800 border border-slate-700 focus:ring-2 focus:ring-indigo-500 outline-none text-white h-20 resize-none"
                            />
                        </div>

                        {/* Benchmarking Text (New) */}
                        <div className="space-y-2">
                            <label className="text-sm font-bold text-slate-300 ml-1">벤치마킹 원고 (선택)</label>
                            <div className="bg-slate-800 p-4 rounded-xl border border-slate-700 focus-within:ring-2 focus-within:ring-indigo-500 focus-within:border-transparent transition-all">
                                <textarea 
                                    value={benchmarkingText}
                                    onChange={(e) => setBenchmarkingText(e.target.value)}
                                    placeholder="성공한 경쟁사의 글이나 모방하고 싶은 텍스트를 붙여넣으세요. &#13;&#10;AI가 해당 글의 논리 구조와 톤앤매너를 분석하여, 우리 브랜드에 맞게 '유사 문서' 걱정 없이 새롭게 재창조합니다."
                                    className="w-full bg-transparent border-none outline-none text-white text-sm h-32 resize-none placeholder-slate-500 leading-relaxed"
                                />
                                <div className="mt-2 pt-2 border-t border-slate-700 flex justify-between items-center">
                                    <p className="text-[11px] text-slate-400">
                                        💡 <strong>팁:</strong> 상호명과 서비스명은 자동으로 변경되며, 문체와 흐름만 모방합니다.
                                    </p>
                                    <span className="text-[10px] bg-slate-700 text-slate-300 px-2 py-1 rounded">
                                        유사 문서 회피 모드
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* Image Asset Inputs */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t border-slate-800">
                             {/* Logo */}
                             <div className="space-y-2">
                                 <label className="text-xs font-bold text-teal-400 block">🖼️ 로고 이미지</label>
                                 <input 
                                    type="file" 
                                    accept="image/*"
                                    onChange={(e) => setLogoFile(e.target.files?.[0] || null)}
                                    className="w-full text-xs text-slate-400 file:mr-2 file:py-1 file:px-2 file:rounded-full file:border-0 file:text-xs file:bg-teal-900/30 file:text-teal-300 hover:file:bg-teal-900"
                                 />
                                 {logoFile && <p className="text-[10px] text-teal-300 truncate">{logoFile.name}</p>}
                             </div>
                             {/* Person */}
                             <div className="space-y-2">
                                 <label className="text-xs font-bold text-purple-400 block">👤 인물 이미지</label>
                                 <input 
                                    type="file" 
                                    accept="image/*"
                                    onChange={(e) => setFaceImageFile(e.target.files?.[0] || null)}
                                    className="w-full text-xs text-slate-400 file:mr-2 file:py-1 file:px-2 file:rounded-full file:border-0 file:text-xs file:bg-purple-900/30 file:text-purple-300 hover:file:bg-purple-900"
                                 />
                                 {faceImageFile && <p className="text-[10px] text-purple-300 truncate">{faceImageFile.name}</p>}
                             </div>
                             {/* Reference */}
                             <div className="space-y-2">
                                 <label className="text-xs font-bold text-slate-300 block">📁 참고 이미지 (최대 50장)</label>
                                 <input 
                                    type="file" 
                                    multiple
                                    accept="image/*"
                                    onChange={handleContextImagesChange}
                                    className="w-full text-xs text-slate-400 file:mr-2 file:py-1 file:px-2 file:rounded-full file:border-0 file:text-xs file:bg-slate-700 file:text-slate-300 hover:file:bg-slate-600"
                                 />
                                 {contextImageFiles.length > 0 && <p className="text-[10px] text-slate-300">{contextImageFiles.length}장 선택됨</p>}
                             </div>
                             {/* Copy Images */}
                             <div className="space-y-2">
                                 <label className="text-xs font-bold text-orange-400 block">📸 카피 이미지 (최대 50장)</label>
                                 <input 
                                    type="file" 
                                    multiple
                                    accept="image/*"
                                    onChange={handleCopyImagesChange}
                                    className="w-full text-xs text-slate-400 file:mr-2 file:py-1 file:px-2 file:rounded-full file:border-0 file:text-xs file:bg-orange-900/30 file:text-orange-300 hover:file:bg-orange-900"
                                 />
                                 {copyImageFiles.length > 0 && <p className="text-[10px] text-orange-300">{copyImageFiles.length}장 선택됨</p>}
                                 <p className="text-[9px] text-slate-500 leading-tight">첨부 시 AI 이미지 생성을 하지 않고, 본문에 삽입 위치를 표시합니다.</p>
                             </div>
                        </div>
                    </div>

                    {/* Action Area */}
                    <div className="pt-4 border-t border-slate-800">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-stretch">
                          {/* Discover */}
                          <button 
                            onClick={handleDiscoverKeywords}
                            disabled={isGenerating || !topic}
                            className="bg-gradient-to-br from-indigo-600 to-purple-700 text-white p-8 rounded-3xl font-bold text-xl hover:shadow-2xl hover:shadow-indigo-500/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed group text-left flex flex-col justify-center min-h-[140px] relative overflow-hidden border border-indigo-400/30 ring-1 ring-indigo-500/20"
                          >
                             <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity transform group-hover:scale-110 duration-500">
                                <svg className="w-40 h-40" fill="currentColor" viewBox="0 0 24 24"><path d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                             </div>
                             <div className="relative z-10 flex items-center gap-3 mb-3">
                                 <span className="text-3xl bg-white/20 p-2.5 rounded-xl backdrop-blur-sm">🔍</span>
                                 <span className="text-2xl tracking-tight">키워드 발굴하기</span>
                             </div>
                             <span className="relative z-10 text-base text-indigo-100 font-normal opacity-90 leading-relaxed max-w-[90%]">
                                 AI가 주제를 심층 분석하여 <span className="text-white font-bold underline decoration-indigo-300 decoration-2 underline-offset-2">황금 키워드</span>를 찾아드립니다.
                             </span>
                             {isGenerating && (
                                <div className="absolute inset-0 bg-black/20 backdrop-blur-[1px] flex items-center justify-center z-20">
                                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
                                </div>
                             )}
                          </button>
                          
                          {/* Manual Start */}
                          <div className="bg-slate-800/60 p-8 rounded-3xl border border-slate-700/50 hover:border-emerald-500/30 hover:bg-slate-800 flex flex-col justify-center shadow-lg group focus-within:ring-2 focus-within:ring-emerald-500/30 transition-all min-h-[140px] relative overflow-hidden">
                               <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 rounded-full blur-3xl -mr-10 -mt-10 pointer-events-none"></div>
                               <div className="relative z-10 flex items-center justify-between mb-5">
                                   <div className="flex items-center gap-3">
                                       <span className="text-2xl bg-emerald-500/20 p-2 rounded-xl text-emerald-400">⚡️</span>
                                       <div>
                                           <span className="text-white font-bold text-xl block">빠른 시작 (Direct)</span>
                                           <span className="text-xs text-slate-400 font-medium">키워드를 이미 알고 계신가요?</span>
                                       </div>
                                   </div>
                               </div>
                               <div className="relative z-10 flex gap-3 h-14">
                                    <input 
                                        type="text" 
                                        value={manualKeyword}
                                        onChange={(e) => setManualKeyword(e.target.value)}
                                        placeholder="키워드를 입력하세요"
                                        className="flex-1 bg-slate-900 border border-slate-600 rounded-xl px-5 text-white placeholder-slate-500 focus:border-emerald-500 outline-none transition-all text-lg shadow-inner"
                                        onKeyDown={(e) => e.key === 'Enter' && handleManualStart()} 
                                    />
                                   <button 
                                      onClick={handleManualStart}
                                      className="bg-emerald-600 hover:bg-emerald-500 text-white px-8 h-full rounded-xl font-bold text-lg transition-all shadow-lg shadow-emerald-900/20 hover:shadow-emerald-500/40 whitespace-nowrap flex items-center gap-2 hover:-translate-y-0.5 active:translate-y-0"
                                   >
                                      Go
                                   </button>
                               </div>
                          </div>
                        </div>
                    </div>

                    {/* Keywords List */}
                    {keywords.length > 0 && (
                        <div className="grid grid-cols-1 gap-4 mt-12 animate-fade-in-up border-t border-slate-800 pt-8">
                          <h3 className="text-xl font-bold text-white mb-4">추천 키워드 분석 결과</h3>
                          {keywords.map((k, idx) => (
                            <div 
                              key={idx}
                              onClick={() => runAutomationSequence(k.keyword)}
                              className="bg-slate-800 p-6 rounded-2xl border border-slate-700 hover:border-indigo-500 cursor-pointer transition-all hover:bg-slate-750 group relative overflow-hidden shadow-md"
                            >
                              <div className="flex justify-between items-center mb-2">
                                <div className="flex items-center gap-3">
                                    <span className="text-2xl font-bold text-white">{k.keyword}</span>
                                    <span className="px-2 py-1 rounded bg-indigo-900 text-indigo-300 text-xs">적합도 {k.suitabilityScore}%</span>
                                </div>
                                <span className="text-slate-400 text-sm">선택 및 자동 실행 &rarr;</span>
                              </div>
                              <p className="text-slate-400 text-sm">{k.reason}</p>
                            </div>
                          ))}
                        </div>
                    )}
                  </div>
                )}

                {/* Step 2: Script */}
                {currentStep === 'script' && (
                    <div className="animate-fade-in space-y-6 pb-20">
                        <div className="flex justify-between items-center">
                            <h2 className="text-2xl font-bold text-white">대본 편집</h2>
                            {isAutoRunning && <span className="animate-pulse text-indigo-400 font-bold">AI가 대본을 작성 중입니다... (자동 진행 중)</span>}
                        </div>
                        <input value={title} onChange={(e) => setTitle(e.target.value)} className="w-full text-2xl font-bold bg-transparent border-b border-slate-700 p-2 text-white" />
                        <div className="grid grid-cols-2 gap-6 h-[600px]">
                            <textarea value={outline} onChange={(e) => setOutline(e.target.value)} className="bg-slate-800 p-4 rounded-xl text-slate-300 resize-none border border-slate-700" />
                            <textarea value={content} onChange={(e) => setContent(e.target.value)} className="bg-slate-800 p-4 rounded-xl text-slate-300 resize-none border border-slate-700" />
                        </div>
                    </div>
                )}

                {/* Step 3: Images */}
                {currentStep === 'images' && (
                    <div className="animate-fade-in space-y-6 pb-20">
                        <div className="flex justify-between items-center">
                            <h2 className="text-2xl font-bold text-white">이미지 생성</h2>
                            {isAutoRunning && <span className="animate-pulse text-indigo-400 font-bold">이미지 렌더링 중... (자동 진행 중)</span>}
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                             {generatedImages.map((img, idx) => (
                                 <div key={idx} className="bg-slate-800 rounded-xl overflow-hidden border border-slate-700">
                                     <div className="aspect-video bg-slate-900 relative">
                                         {img.isLoading ? (
                                             <div className="absolute inset-0 flex items-center justify-center text-indigo-500">생성 중...</div>
                                         ) : img.url ? (
                                             <img src={img.url} alt="Gen" className="w-full h-full object-cover" />
                                         ) : (
                                             <div className="absolute inset-0 flex items-center justify-center text-slate-600">대기</div>
                                         )}
                                     </div>
                                     <div className="p-4 text-xs text-slate-400">{img.prompt}</div>
                                 </div>
                             ))}
                        </div>
                    </div>
                )}

                {/* Step 4: Thumbnail */}
                {currentStep === 'thumbnail' && (
                    <div className="animate-fade-in space-y-6 flex flex-col items-center pb-20">
                        <h2 className="text-2xl font-bold text-white">썸네일</h2>
                        {isAutoRunning && <span className="animate-pulse text-indigo-400 font-bold mb-4">1:1 고해상도 썸네일 제작 중... (자동 진행 중)</span>}
                        <div className="w-96 h-96 bg-slate-800 rounded-2xl border border-slate-700 overflow-hidden relative shadow-2xl">
                             {thumbnail ? (
                                 <img src={thumbnail} className="w-full h-full object-cover" />
                             ) : (
                                 <div className="absolute inset-0 flex items-center justify-center text-slate-500">생성 중...</div>
                             )}
                        </div>
                    </div>
                )}

                {/* Step 5: Result */}
                {currentStep === 'result' && (
                    <div className="animate-fade-in space-y-8 pb-20">
                        {/* Header Actions */}
                        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-slate-900 p-6 rounded-2xl border border-slate-800 shadow-xl sticky top-0 z-50">
                            <h1 className="text-2xl font-bold text-white">✨ 최종 결과물</h1>
                            <div className="flex flex-wrap gap-3">
                                <button 
                                    onClick={() => copyToClipboard(title)}
                                    className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-sm font-medium transition-colors border border-slate-700"
                                >
                                    📋 제목 복사
                                </button>
                                <button 
                                    onClick={handleCopyHtml}
                                    className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-sm font-medium transition-colors border border-slate-700"
                                >
                                    📋 HTML 복사 (표/인용구 포함)
                                </button>
                                <button 
                                    onClick={downloadAllImagesAsPng}
                                    className="px-6 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-sm font-bold transition-colors shadow-lg shadow-indigo-500/30 flex items-center gap-2"
                                >
                                    📥 이미지 전체 다운로드 (PNG)
                                </button>
                                <button onClick={() => setCurrentStep('keyword')} className="text-slate-400 text-sm underline px-2">
                                    처음으로
                                </button>
                            </div>
                        </div>

                        {/* Title Section */}
                        <div className="bg-white text-black p-8 rounded-2xl shadow-lg">
                             <h2 className="text-sm font-bold text-slate-500 mb-2 uppercase tracking-wide">Blog Title</h2>
                             <h1 className="text-3xl md:text-4xl font-extrabold text-blue-900 leading-tight">{title}</h1>
                        </div>

                        {/* Visual Assets Gallery */}
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                            {/* Thumbnail */}
                            <div className="lg:col-span-1 space-y-3">
                                <h3 className="text-white font-bold text-lg flex items-center gap-2">
                                    <span>🎨</span> 메인 썸네일 (1:1)
                                </h3>
                                <div className="aspect-square rounded-2xl overflow-hidden border-2 border-slate-700 shadow-2xl bg-slate-800 relative group">
                                    {thumbnail ? (
                                        <>
                                            <img src={thumbnail} className="w-full h-full object-cover" alt="Thumbnail" />
                                            <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-2">
                                                <a href={thumbnail} download="thumbnail.png" className="bg-white text-black px-4 py-2 rounded-lg font-bold text-sm hover:bg-slate-200 transition-colors w-32 text-center">다운로드</a>
                                                <button 
                                                    onClick={() => {
                                                        setEditingImageIndex(-1);
                                                        setEditPrompt(thumbnailPrompt);
                                                    }}
                                                    className="bg-indigo-600 text-white px-4 py-2 rounded-lg font-bold text-sm hover:bg-indigo-500 transition-colors w-32"
                                                >
                                                    수정하기
                                                </button>
                                            </div>
                                        </>
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center text-slate-500">이미지 없음</div>
                                    )}
                                </div>
                            </div>
                            
                            {/* Blog Images */}
                            <div className="lg:col-span-2 space-y-3">
                                <h3 className="text-white font-bold text-lg flex items-center gap-2">
                                    <span>🖼️</span> {copyImageFiles.length > 0 ? `첨부된 카피 이미지 (${copyImageFiles.length}장)` : `본문 삽입 이미지 (${generatedImages.filter(i => i.url).length}장)`}
                                </h3>
                                <div className="grid grid-cols-2 gap-4">
                                    {copyImageFiles.length > 0 ? (
                                        copyImageFiles.map((file, idx) => (
                                            <div key={idx} className="aspect-video rounded-xl overflow-hidden border border-slate-700 bg-slate-800 relative group">
                                                <img src={URL.createObjectURL(file)} className="w-full h-full object-cover" alt={`Copy Image ${idx}`} />
                                                <div className="absolute top-2 left-2 bg-black/70 text-white text-[10px] px-2 py-1 rounded">이미지 {idx + 1}</div>
                                                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                                    <a href={URL.createObjectURL(file)} download={file.name} className="bg-white text-black px-3 py-1.5 rounded-lg font-bold text-xs hover:bg-slate-200 transition-colors">다운로드</a>
                                                </div>
                                            </div>
                                        ))
                                    ) : (
                                        generatedImages.map((img, idx) => (
                                            <div key={idx} className="aspect-video rounded-xl overflow-hidden border border-slate-700 bg-slate-800 relative group">
                                                {img.url ? (
                                                    <>
                                                        <img src={img.url} className="w-full h-full object-cover" alt={`Blog Image ${idx}`} />
                                                        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-2">
                                                            <a href={img.url} download={`image_${idx+1}.png`} className="bg-white text-black px-3 py-1.5 rounded-lg font-bold text-xs hover:bg-slate-200 transition-colors w-24 text-center">다운로드</a>
                                                            <button 
                                                                onClick={() => {
                                                                    setEditingImageIndex(idx);
                                                                    setEditPrompt(img.prompt);
                                                                }}
                                                                className="bg-indigo-600 text-white px-3 py-1.5 rounded-lg font-bold text-xs hover:bg-indigo-500 transition-colors w-24"
                                                            >
                                                                수정하기
                                                            </button>
                                                        </div>
                                                    </>
                                                ) : (
                                                    <div className="w-full h-full flex items-center justify-center text-slate-500 text-xs">대기 중</div>
                                                )}
                                            </div>
                                        ))
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Main Content */}
                        <div className="bg-white text-black p-12 rounded-2xl shadow-2xl border-t-8 border-indigo-600">
                             <style>{`
                                .colored-content p:nth-of-type(4n+1) { color: #D32F2F !important; }
                                .colored-content p:nth-of-type(4n+2) { color: #1A237E !important; }
                                .colored-content p:nth-of-type(4n+3) { color: #1B5E20 !important; }
                                .colored-content p:nth-of-type(4n+4) { color: #3E2723 !important; }
                                
                                .colored-content li:nth-of-type(4n+1) { color: #D32F2F !important; }
                                .colored-content li:nth-of-type(4n+2) { color: #1A237E !important; }
                                .colored-content li:nth-of-type(4n+3) { color: #1B5E20 !important; }
                                .colored-content li:nth-of-type(4n+4) { color: #3E2723 !important; }

                                .colored-content h1, .colored-content h2, .colored-content h3 { color: #0f172a !important; }
                             `}</style>
                             <div className="prose prose-lg max-w-none colored-content" ref={resultContentRef}>
                                 <ReactMarkdown remarkPlugins={[remarkGfm]}>{content}</ReactMarkdown>
                             </div>
                        </div>
                    </div>
                )}

                {/* Edit Modal */}
                {editingImageIndex !== null && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
                        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-8 max-w-2xl w-full space-y-6 shadow-2xl">
                            <div className="flex justify-between items-center">
                                <h3 className="text-xl font-bold text-white">이미지 수정 및 재생성</h3>
                                <button onClick={() => setEditingImageIndex(null)} className="text-slate-400 hover:text-white">
                                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                                </button>
                            </div>
                            
                            <div className="space-y-2">
                                <label className="text-sm font-bold text-slate-400">이미지 생성 프롬프트</label>
                                <textarea 
                                    value={editPrompt}
                                    onChange={(e) => setEditPrompt(e.target.value)}
                                    className="w-full h-32 p-4 bg-slate-800 border border-slate-700 rounded-xl text-white focus:ring-2 focus:ring-indigo-500 outline-none resize-none"
                                    placeholder="이미지 묘사를 입력하세요..."
                                />
                            </div>

                            <div className="flex gap-3 pt-4">
                                <button 
                                    onClick={() => setEditingImageIndex(null)}
                                    className="flex-1 py-3 bg-slate-800 hover:bg-slate-700 text-white rounded-xl font-bold transition-all"
                                >
                                    취소
                                </button>
                                <button 
                                    onClick={handleRegenerateImage}
                                    disabled={isRegenerating || !editPrompt.trim()}
                                    className="flex-1 py-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-bold transition-all shadow-lg shadow-indigo-500/20 disabled:opacity-50 flex items-center justify-center gap-2"
                                >
                                    {isRegenerating ? (
                                        <>
                                            <span className="animate-spin">🌀</span>
                                            생성 중...
                                        </>
                                    ) : '이미지 재생성'}
                                </button>
                            </div>
                        </div>
                    </div>
                )}

            </div>
        </div>
    </div>
  );
};
