import React, { useState, useRef, useEffect, useMemo } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { marked } from 'marked';
import * as mammoth from 'mammoth';
import * as pdfjsLib from 'pdfjs-dist';
import { 
  suggestRelatedKeywords, 
  generateOutline, 
  generateFullPostStream, 
  generateImagePromptsForPost, 
  generateThumbnailPrompt, 
  generateBlogImage,
  generateTitleStream,
  generateUSPStream,
  generateUSP,
  generateTitle,
  ImagePromptRequest
} from '../services/geminiService';
import { StudioStep, GeneratedImage, KeywordSuggestion } from '../types';

// PDF worker setup
pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;

const steps: { id: StudioStep; label: string; icon: string }[] = [
  { id: 'keyword', label: '키워드 발굴', icon: '🔍' },
  { id: 'usp', label: 'USP 도출', icon: '🎯' },
  { id: 'title', label: '제목 생성', icon: '📝' },
  { id: 'script', label: '대본 생성', icon: '📄' },
  { id: 'images', label: '이미지 생성', icon: '🖼️' },
  { id: 'thumbnail', label: '썸네일 생성', icon: '🎨' },
  { id: 'result', label: '최종 결과', icon: '🏆' },
];

export const ContentWriter: React.FC = () => {
  // --- State: UI Flags ---
  
  // --- State: Inputs ---
  const [topic, setTopic] = useState('');
  const [blogStyle, setBlogStyle] = useState('');
  const [blogCategory, setBlogCategory] = useState('');
  const [blogPlatform, setBlogPlatform] = useState('');
  const [storeName, setStoreName] = useState('');
  const [salesService, setSalesService] = useState('');
  const [postGoal, setPostGoal] = useState(''); // USP / Goal
  const [referenceNote, setReferenceNote] = useState('');
  const [mustIncludeContent, setMustIncludeContent] = useState('');
  const [benchmarkingText, setBenchmarkingText] = useState('');
  const [servicePriceText, setServicePriceText] = useState('');
  
  // --- State: Advanced Inputs ---
  const [targetAudience, setTargetAudience] = useState('');
  const [secondaryKeywords, setSecondaryKeywords] = useState('');
  const [cta, setCta] = useState('');
  const [faq, setFaq] = useState('');
  const [includeFaq, setIncludeFaq] = useState(false);

  // --- State: Files ---
  const [referenceFiles, setReferenceFiles] = useState<File[]>([]); // Text context files
  const [servicePriceFiles, setServicePriceFiles] = useState<File[]>([]);
  const [logoFiles, setLogoFiles] = useState<File[]>([]);
  const [faceImageFiles, setFaceImageFiles] = useState<File[]>([]);
  const [contextImageFiles, setContextImageFiles] = useState<File[]>([]); // General references
  const [launderedImageFiles, setLaunderedImageFiles] = useState<File[]>([]); // Laundered images
  const [skipImageGeneration, setSkipImageGeneration] = useState<boolean>(false); // Skip image generation

  // --- State: Process ---
  const [currentStep, setCurrentStep] = useState<StudioStep>('keyword');
  const [keywords, setKeywords] = useState<KeywordSuggestion[]>([]);
  const [selectedKeyword, setSelectedKeyword] = useState('');
  const [manualKeyword, setManualKeyword] = useState('');
  const [isAutoRunning, setIsAutoRunning] = useState(false);
  const [isFullAuto, setIsFullAuto] = useState(false);
  
  // --- State: Generation Results ---
  const [title, setTitle] = useState('');
  const [titleOptions, setTitleOptions] = useState<string[]>([]);
  const [outline, setOutline] = useState('');
  const [content, setContent] = useState('');
  const [hashtags, setHashtags] = useState('');
  const [generatedImages, setGeneratedImages] = useState<GeneratedImage[]>([]);
  const [launderedImages, setLaunderedImages] = useState<string[]>([]);
  const [thumbnailPrompt, setThumbnailPrompt] = useState('');
  const [thumbnail, setThumbnail] = useState<GeneratedImage | null>(null);
  const [editingImageIndex, setEditingImageIndex] = useState<number | null>(null); // null for none, -1 for thumbnail, 0+ for generatedImages
  const [editPrompt, setEditPrompt] = useState('');
  const [isRegenerating, setIsRegenerating] = useState(false);
  
  // --- State: UI Flags ---
  const [isGenerating, setIsGenerating] = useState(false);
  const [isGeneratingUSP, setIsGeneratingUSP] = useState(false);
  const [uspProgress, setUspProgress] = useState(0);
  const [stepProgress, setStepProgress] = useState(0);
  const [isStepComplete, setIsStepComplete] = useState(true);
  const [isError, setIsError] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [imageCount, setImageCount] = useState<number>(4);
  const [isAutoImageCount, setIsAutoImageCount] = useState<boolean>(true);
  const [selectedImageModel, setSelectedImageModel] = useState<string>('gemini-3.1-flash-image-preview');
  const [selectedImageStyle, setSelectedImageStyle] = useState<string>('기본 스타일');
  const [wordCount, setWordCount] = useState<string>('AI 추천 (자동)');

  const IMAGE_MODELS = [
      { id: 'gemini-2.5-flash-image', name: 'Gemini 2.5 Flash Image', desc: '표준 이미지 생성' },
      { id: 'gemini-3.1-flash-image-preview', name: 'Nano Banana 2 (Gemini 3.1 Flash Image)', desc: '한국어 텍스트 이미지 생성' },
      { id: 'gemini-3.1-flash-image-preview-no-text', name: 'Nano Banana 2 (이미지 위주, 텍스트 없음)', desc: '한국어 텍스트 깨짐 방지' },
      { id: 'imagen-4.0-generate-001', name: 'Imagen 4.0', desc: '사실적인 이미지 생성' },
  ];

  const IMAGE_STYLES = [
      { id: '기본 스타일', name: '기본 스타일', desc: '블로그 주제에 가장 적합한 스타일로 자동 생성' },
      { id: '실사/사진', name: '실사/사진', desc: '고해상도 카메라로 촬영한 듯한 사실적인 사진 스타일' },
      { id: '3D 렌더링', name: '3D 렌더링', desc: '입체적이고 매끄러운 3D 그래픽 스타일' },
      { id: '일러스트', name: '일러스트', desc: '깔끔하고 현대적인 벡터 일러스트 스타일' },
      { id: '수채화', name: '수채화', desc: '부드럽고 감성적인 수채화 느낌의 스타일' },
      { id: '유화', name: '유화', desc: '질감이 살아있는 클래식한 유화 스타일' },
      { id: '미니멀리즘', name: '미니멀리즘', desc: '여백의 미를 살린 심플하고 깨끗한 스타일' },
      { id: '팝아트', name: '팝아트', desc: '강렬한 색감과 굵은 선의 팝아트 스타일' },
      { id: '빈티지/레트로', name: '빈티지/레트로', desc: '오래된 필름 사진이나 복고풍 느낌의 스타일' },
      { id: '애니메이션', name: '애니메이션', desc: '생동감 넘치는 일본 애니메이션 감성의 스타일' },
      { id: '사이버펑크', name: '사이버펑크', desc: '네온 컬러와 미래지향적인 분위기의 스타일' },
      { id: '스케치/드로잉', name: '스케치/드로잉', desc: '연필이나 펜으로 그린 듯한 감각적인 스케치 스타일' },
      { id: '픽셀 아트', name: '픽셀 아트', desc: '레트로 게임 느낌의 도트 그래픽 스타일' },
      { id: '종이 공예', name: '종이 공예', desc: '종이를 오려 붙인 듯한 입체적인 페이퍼 아트 스타일' },
      { id: '클레이 아트', name: '클레이 아트', desc: '찰흙으로 빚은 듯한 귀엽고 둥글둥글한 스타일' },
      { id: '흑백/느와르', name: '흑백/느와르', desc: '분위기 있고 강렬한 대비의 흑백 스타일' },
      { id: '코믹북', name: '코믹북', desc: '만화책 특유의 점묘법과 말풍선 느낌의 스타일' },
      { id: '판타지', name: '판타지', desc: '몽환적이고 신비로운 분위기의 판타지 스타일' },
      { id: '콜라주', name: '콜라주', desc: '다양한 질감을 섞어 만든 예술적인 콜라주 스타일' },
      { id: '아르누보', name: '아르누보', desc: '곡선과 화려한 장식이 돋보이는 예술 스타일' },
  ];
  
  // --- Refs ---
  const resultContentRef = useRef<HTMLDivElement>(null);
  const nextStepResolver = useRef<(() => void) | null>(null);
  const automationKilled = useRef(false);

  // --- Helpers ---
  const waitForNextStep = (forceAuto?: boolean) => {
    if (forceAuto ?? isFullAuto) {
        return new Promise<void>(resolve => setTimeout(resolve, 2000));
    }
    setIsStepComplete(true);
    return new Promise<void>((resolve) => {
        nextStepResolver.current = resolve;
    });
  };

  const handleRetryStep = () => {
      runAutomationSequence(selectedKeyword, isFullAuto, currentStep);
  };

  const handleNextStep = () => {
    if (nextStepResolver.current) {
        nextStepResolver.current();
        nextStepResolver.current = null;
        setIsStepComplete(false);
    } else {
        handleForwardStep();
    }
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      if (!file) return;

      try {
          if (file.type === 'text/plain') {
              const text = await file.text();
              setBenchmarkingText(text);
          } else if (file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
              const arrayBuffer = await file.arrayBuffer();
              const result = await mammoth.extractRawText({ arrayBuffer });
              setBenchmarkingText(result.value);
          } else if (file.type === 'application/pdf') {
              const arrayBuffer = await file.arrayBuffer();
              const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
              let text = '';
              for (let i = 1; i <= pdf.numPages; i++) {
                  const page = await pdf.getPage(i);
                  const content = await page.getTextContent();
                  text += content.items.map((item: any) => item.str).join(' ');
              }
              setBenchmarkingText(text);
          } else {
              alert('지원하지 않는 파일 형식입니다. (PDF, TXT, DOCX만 가능)');
          }
      } catch (e) {
          console.error(e);
          alert('파일 읽기 중 오류가 발생했습니다.');
      }
  };

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
    for (const file of logoFiles) {
        if (isSupportedImage(file)) refs.push(await convertFileToBase64(file));
    }
    for (const file of contextImageFiles) {
        if (isSupportedImage(file)) refs.push(await convertFileToBase64(file));
    }
    return refs;
  };

  const getFaceRefs = async () => {
      const refs: { data: string, mimeType: string }[] = [];
      for (const file of faceImageFiles) {
          if (isSupportedImage(file)) refs.push(await convertFileToBase64(file));
      }
      return refs;
  };

  const launderImage = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => {
            const img = new Image();
            img.onload = () => {
                const canvas = document.createElement('canvas');
                
                // 1. Slightly crop the image (1-3 pixels) to change dimensions and perceptual hash
                const cropX = Math.floor(Math.random() * 3) + 1;
                const cropY = Math.floor(Math.random() * 3) + 1;
                
                canvas.width = img.width - (cropX * 2);
                canvas.height = img.height - (cropY * 2);
                
                const ctx = canvas.getContext('2d');
                if (!ctx) {
                    reject(new Error('Failed to get canvas context'));
                    return;
                }
                
                // Draw image shifted to apply crop
                ctx.drawImage(img, -cropX, -cropY);
                
                // 2. Add very faint random noise to change pixel values globally
                const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
                const data = imageData.data;
                for (let i = 0; i < data.length; i += 4) {
                    // Add random noise between -1 and 1 to RGB channels
                    const noise = Math.floor(Math.random() * 3) - 1;
                    data[i] = Math.max(0, Math.min(255, data[i] + noise));     // R
                    data[i+1] = Math.max(0, Math.min(255, data[i+1] + noise)); // G
                    data[i+2] = Math.max(0, Math.min(255, data[i+2] + noise)); // B
                }
                ctx.putImageData(imageData, 0, 0);
                
                // 3. Export with slightly randomized quality (for JPEG)
                const isPng = file.type === 'image/png';
                const mimeType = isPng ? 'image/png' : 'image/jpeg';
                const quality = isPng ? undefined : 0.90 + (Math.random() * 0.09); // 0.90 to 0.99
                
                resolve(canvas.toDataURL(mimeType, quality));
            };
            img.onerror = reject;
            img.src = e.target?.result as string;
        };
        reader.onerror = reject;
        reader.readAsDataURL(file);
    });
  };

  // --- Automatic Workflow ---
  const runAutomationSequence = async (keyword: string, fullAuto: boolean = false, startFromStep?: StudioStep) => {
    if (!keyword) return;
    if (!blogPlatform || !blogCategory) {
        alert('블로그 플랫폼과 블로그 분류를 선택해주세요.');
        return;
    }
    if (!blogStyle) {
        alert('블로그 스타일을 선택해주세요.');
        return;
    }
    setIsAutoRunning(true);
    setIsFullAuto(fullAuto);
    setSelectedKeyword(keyword);
    setIsError(false);
    setErrorMessage('');
    automationKilled.current = false;

    try {
        // --- Pre-process Files ---
        const fileParts = [];
        for (const file of referenceFiles) {
            fileParts.push(await convertFileToBase64(file));
        }

        // --- Step 0: API Key Check ---
        const hasKey = await checkAndRequireApiKey();
        if (!hasKey) {
            alert("작업을 위해 API 키 선택이 필요합니다. 자동화를 중단합니다.");
            setIsAutoRunning(false);
            return;
        }

        const stepOrder: StudioStep[] = ['keyword', 'usp', 'title', 'script', 'images', 'thumbnail', 'result'];
        const startIndex = startFromStep ? stepOrder.indexOf(startFromStep) : 1; // Default to 'usp' (index 1)

        // --- Step 1: USP ---
        let uspRes = postGoal;
        if (startIndex <= 1) {
            if (automationKilled.current) return;
            setCurrentStep('usp');
            setStepProgress(0);
            const suggestedKeywordStrings = keywords.map(k => k.keyword);
            setPostGoal(''); // Clear before streaming
            uspRes = await generateUSPStream(
                topic, 
                (chunk) => {
                    setPostGoal(prev => prev + chunk);
                    setStepProgress(prev => Math.min(prev + 0.5, 95));
                },
                storeName || undefined, 
                salesService || undefined, 
                blogCategory || undefined, 
                blogPlatform || undefined, 
                suggestedKeywordStrings,
                {
                    targetAudience,
                    secondaryKeywords,
                    cta,
                    faq,
                    referenceNote,
                    mustIncludeContent
                },
                fileParts
            );
            setStepProgress(100);
            await waitForNextStep(fullAuto);
        }

        // --- Step 2: Title ---
        let generatedTitles = titleOptions;
        if (startIndex <= 2) {
            if (automationKilled.current) return;
            setCurrentStep('title');
            setStepProgress(0);
            setTitleOptions([]); // Clear before streaming
            generatedTitles = await generateTitleStream(
                keyword, 
                topic || keyword, 
                (titles) => {
                    setTitleOptions(titles);
                    setStepProgress(prev => Math.min(prev + 5, 95));
                },
                uspRes, 
                referenceNote, 
                blogCategory, 
                blogPlatform, 
                storeName,
                fileParts
            );
            if (generatedTitles && generatedTitles.length > 0) {
                setTitle(generatedTitles[0]);
            } else {
                // Fallback if streaming failed or returned empty
                const fallbackTitle = `${keyword} ${topic}`.trim();
                setTitle(fallbackTitle);
                setTitleOptions([fallbackTitle]);
            }
            setStepProgress(100);
            await waitForNextStep(fullAuto);
        }

        // --- Step 3: Script ---
        let accumulatedContent = content + (hashtags ? `\n\n[HASHTAGS]\n${hashtags}` : '');
        if (startIndex <= 3) {
            if (automationKilled.current) return;
            setCurrentStep('script');
            setStepProgress(0);
            
            const servicePriceImageParts = [];
            for (const file of servicePriceFiles) {
                 servicePriceImageParts.push(await convertFileToBase64(file));
            }

            // Generate Outline
            const scriptImageParts = [];
            for (const file of contextImageFiles) {
                 scriptImageParts.push(await convertFileToBase64(file));
            }

            const advancedOptions = [];
            if (targetAudience) advancedOptions.push(`타겟 고객층: ${targetAudience}`);
            if (secondaryKeywords) advancedOptions.push(`서브 키워드: ${secondaryKeywords}`);
            if (cta) advancedOptions.push(`행동 유도(CTA) 및 연락처/링크: ${cta}`);
            if (faq) advancedOptions.push(`자주 묻는 질문(FAQ): ${faq}`);
            
            const advancedOptionsText = advancedOptions.length > 0 ? `\n\n[고급 설정 정보]\n${advancedOptions.join('\n')}` : '';
            const combinedReferenceNote = referenceNote + advancedOptionsText;

            const outlineRes = await generateOutline(
                keyword, storeName, salesService, uspRes, fileParts, undefined, benchmarkingText, combinedReferenceNote, scriptImageParts, mustIncludeContent, blogCategory, blogPlatform, servicePriceText, servicePriceImageParts, blogStyle, wordCount, faq, includeFaq
            );
            setOutline(outlineRes);

            // Generate Content
            accumulatedContent = '';
            setContent('');
            setHashtags('');
            const hashtagMarker = "[HASHTAGS]";
            let hasReachedHashtags = false;

            await generateFullPostStream(
                keyword, outlineRes, storeName, salesService, uspRes, 
                (chunk) => {
                    if (automationKilled.current) return;
                    accumulatedContent += chunk;
                    setStepProgress(prev => Math.min(prev + 0.1, 95));
                    if (accumulatedContent.includes(hashtagMarker)) {
                        hasReachedHashtags = true;
                        const parts = accumulatedContent.split(hashtagMarker);
                        setContent(parts[0].trim());
                        setHashtags(parts[1].trim());
                    } else if (!hasReachedHashtags) {
                        setContent(prev => prev + chunk);
                    } else {
                        const parts = accumulatedContent.split(hashtagMarker);
                        setHashtags(parts[1].trim());
                    }
                }, 
                () => {
                    accumulatedContent = '';
                    setContent('');
                    setHashtags('');
                    hasReachedHashtags = false;
                },
                fileParts, undefined, benchmarkingText, combinedReferenceNote, scriptImageParts, mustIncludeContent, blogCategory, blogPlatform, servicePriceText, servicePriceImageParts, blogStyle, wordCount, faq, includeFaq
            );
            setStepProgress(100);
            await waitForNextStep(fullAuto);
        }

        // --- Step 4: Images ---
        const faceParts = await getFaceRefs();
        const refParts = await getImageRefs();

        if (startIndex <= 4) {
            if (automationKilled.current) return;
            const processedLaundered = [];
            for (const file of launderedImageFiles) {
                processedLaundered.push(await launderImage(file));
            }
            setLaunderedImages(processedLaundered);

            if (skipImageGeneration) {
                // Skip AI image generation
                setGeneratedImages([]);
                setThumbnail(null);
                setThumbnailPrompt('');
                setCurrentStep('result');
                setIsAutoRunning(false);
                return;
            }

            setCurrentStep('images');
            setStepProgress(0);
            
            const finalImageCount = isAutoImageCount ? 5 : imageCount;
            const prompts = await generateImagePromptsForPost(accumulatedContent, faceParts.length > 0, finalImageCount, refParts.length > 0, selectedImageModel, selectedImageStyle);
            
            const placeholders: GeneratedImage[] = prompts.map(p => ({
                prompt: p.prompt,
                context: p.context,
                url: null,
                isLoading: true
            }));
            setGeneratedImages(placeholders);

            // Run image generation
            for (const [index, item] of placeholders.entries()) {
                if (automationKilled.current) return;
                try {
                    const modelToUse = selectedImageModel === 'gemini-3.1-flash-image-preview-no-text' ? 'gemini-3.1-flash-image-preview' : selectedImageModel;
                    const promptToUse = selectedImageModel === 'gemini-3.1-flash-image-preview-no-text' ? `${item.prompt}, no text, no words` : item.prompt;
                    const url = await generateBlogImage(promptToUse, "16:9", refParts, faceParts, modelToUse);
                    setGeneratedImages(prev => {
                        const newArr = [...prev];
                        newArr[index] = { ...newArr[index], url, isLoading: false };
                        return newArr;
                    });
                    setStepProgress(((index + 1) / placeholders.length) * 100);
                } catch (e) {
                    console.error(`Image ${index} failed`, e);
                    const errorMessage = e instanceof Error ? e.message : String(e);
                    setGeneratedImages(prev => {
                        const newArr = [...prev];
                        newArr[index] = { ...newArr[index], isLoading: false, error: errorMessage };
                        return newArr;
                    });
                }
            }
            setStepProgress(100);
            await waitForNextStep(fullAuto);
        }

        // --- Step 5: Thumbnail ---
        if (startIndex <= 5) {
            if (automationKilled.current) return;
            setCurrentStep('thumbnail');
            setStepProgress(0);
            const thumbPrompt = await generateThumbnailPrompt(keyword, accumulatedContent, selectedImageModel, selectedImageStyle);
            setThumbnailPrompt(thumbPrompt);
            
            setThumbnail({ prompt: thumbPrompt, context: '', url: null, isLoading: true });
            
            try {
                const modelToUse = selectedImageModel === 'gemini-3.1-flash-image-preview-no-text' ? 'gemini-3.1-flash-image-preview' : selectedImageModel;
                const promptToUse = selectedImageModel === 'gemini-3.1-flash-image-preview-no-text' ? `${thumbPrompt}, no text, no words` : thumbPrompt;
                const thumbUrl = await generateBlogImage(promptToUse, "1:1", refParts, faceParts, modelToUse);
                setThumbnail({ prompt: thumbPrompt, context: '', url: thumbUrl, isLoading: false });
                setStepProgress(100);
            } catch (e) {
                console.error("Thumbnail generation failed", e);
                const errorMessage = e instanceof Error ? e.message : String(e);
                setThumbnail({ prompt: thumbPrompt, context: '', url: null, isLoading: false, error: errorMessage });
            }
            await waitForNextStep(fullAuto);
        }

        // --- Step 6: Result ---
        if (automationKilled.current) return;
        setCurrentStep('result');

    } catch (e) {
        console.error("Automation Error", e);
        const errorMessage = e instanceof Error ? e.message : String(e);
        setIsError(true);
        setErrorMessage(errorMessage);
        alert(`작업 중 오류가 발생했습니다: ${errorMessage}`);
    } finally {
        setIsAutoRunning(false);
    }
  };

  // --- Handlers ---
  const handleGenerateUSP = async () => {
      // This function is no longer used in the keyword step UI
      return;
  };

  const handleDiscoverKeywords = async () => {
    if (!topic) return;
    setIsGenerating(true);
    try {
      const fileParts = [];
      for (const file of referenceFiles) {
          fileParts.push(await convertFileToBase64(file));
      }
      const results = await suggestRelatedKeywords(topic, storeName, salesService, postGoal, fileParts, referenceNote, blogCategory, blogPlatform);
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
      if (isAutoRunning) {
          setIsAutoRunning(false);
          automationKilled.current = true;
      }
      const stepOrder: StudioStep[] = ['keyword', 'usp', 'title', 'script', 'images', 'thumbnail', 'result'];
      const currentIdx = stepOrder.indexOf(currentStep);
      if (currentIdx > 0) {
          setCurrentStep(stepOrder[currentIdx - 1]);
      } else {
          setCurrentStep('result');
      }
  };

  const handleForwardStep = () => {
      if (isAutoRunning) return;
      const stepOrder: StudioStep[] = ['keyword', 'usp', 'title', 'script', 'images', 'thumbnail', 'result'];
      const currentIdx = stepOrder.indexOf(currentStep);
      if (currentIdx < stepOrder.length - 1) {
          setCurrentStep(stepOrder[currentIdx + 1]);
      } else {
          setCurrentStep('keyword');
      }
  };

  const handleRegenerateImage = async () => {
    if (editingImageIndex === null) return;
    setIsRegenerating(true);
    try {
        const faceParts = await getFaceRefs();
        const refParts = await getImageRefs();
        const ratio = editingImageIndex === -1 ? "1:1" : "16:9";
        const modelToUse = selectedImageModel === 'gemini-3.1-flash-image-preview-no-text' ? 'gemini-3.1-flash-image-preview' : selectedImageModel;
        const promptToUse = selectedImageModel === 'gemini-3.1-flash-image-preview-no-text' ? `${editPrompt}, no text, no words` : editPrompt;
        
        const newUrl = await generateBlogImage(promptToUse, ratio, refParts, faceParts, modelToUse);
        
        if (editingImageIndex === -1) {
            setThumbnail({ prompt: editPrompt, context: '', url: newUrl, isLoading: false });
            setThumbnailPrompt(editPrompt);
        } else {
            setGeneratedImages(prev => {
                const newArr = [...prev];
                newArr[editingImageIndex] = { ...newArr[editingImageIndex], url: newUrl, prompt: editPrompt, isLoading: false, error: undefined };
                return newArr;
            });
        }
        setEditingImageIndex(null);
    } catch (e) {
        console.error("Regeneration failed", e);
        const errorMessage = e instanceof Error ? e.message : String(e);
        if (editingImageIndex === -1) {
            setThumbnail(prev => prev ? { ...prev, isLoading: false, error: errorMessage } : null);
        } else if (editingImageIndex !== null) {
            setGeneratedImages(prev => {
                const newArr = [...prev];
                newArr[editingImageIndex] = { ...newArr[editingImageIndex], isLoading: false, error: errorMessage };
                return newArr;
            });
        }
        alert(`이미지 수정 중 오류가 발생했습니다: ${errorMessage}`);
    } finally {
        setIsRegenerating(false);
    }
  };

  const isSupportedImage = (file: File) => {
      const supportedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'image/heif'];
      if (supportedTypes.includes(file.type)) return true;
      
      const ext = file.name.split('.').pop()?.toLowerCase();
      const supportedExts = ['jpg', 'jpeg', 'png', 'webp', 'heic', 'heif'];
      return supportedExts.includes(ext || '');
  };

  const handleContextImagesChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
        const filesArray = Array.from(e.target.files);
        const validFiles = filesArray.filter(isSupportedImage);
        if (validFiles.length < filesArray.length) {
            alert('지원하지 않는 이미지 형식이 포함되어 있습니다. JPEG, PNG, WEBP, HEIC, HEIF만 가능합니다.');
        }
        setContextImageFiles(prev => [...prev, ...validFiles]);
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

    if (blogCategory.includes('리뷰')) {
        // Remove '- ' at the start of lines to prevent bullets/hyphens when copying
        processed = processed.replace(/^-\s+/gm, '');
    }

    // Custom formatting rule application BEFORE marked processing
    processed = processed.replace(/\*\*\*(.*?)\*\*\*/g, '<span style="background-color: #fef08a; color: #dc2626; font-weight: bold;">$1</span>');
    processed = processed.replace(/\*\*(.*?)\*\*/g, '<span style="color: #dc2626; font-weight: bold;">$1</span>');
    processed = processed.replace(/~~(.*?)~~/g, '<span style="color: #8B4513; font-weight: bold;">$1</span>'); // Brown
    processed = processed.replace(/`(.*?)`/g, '<span style="background-color: #fef08a; color: #2563eb; font-weight: bold;">$1</span>');
    processed = processed.replace(/\*(.*?)\*/g, '<span style="color: #2563eb; font-weight: bold;">$1</span>');

    // Parse markdown to HTML (handles tables, lists, etc.)
    const htmlContent = marked.parse(processed, { breaks: true }) as string;

    // Apply inline styles to Tables and Blockquotes (Citations) for clipboard compatibility
    let styledHtml = htmlContent
        // Table Styles
        .replace(/<table>/g, '<table style="border-collapse: collapse; width: 100%; border: 1px solid #cbd5e1; margin: 20px 0;">')
        .replace(/<th>/g, '<th style="border: 1px solid #cbd5e1; padding: 12px; background-color: #bfdbfe; font-weight: bold; text-align: left; color: #0f172a;">')
        .replace(/<td>/g, '<td style="border: 1px solid #cbd5e1; padding: 12px; color: #1f2937;">')
        // Blockquote (Citation) Styles - Blue bar on left, light blue background
        .replace(/<blockquote>/g, '<blockquote style="border-left: 8px solid #2563eb; background-color: #eff6ff; padding: 20px; margin: 30px 0; border-top-right-radius: 12px; border-bottom-right-radius: 12px; color: #1e40af; font-weight: 800; font-size: 1.2em; box-shadow: 0 2px 4px rgba(37, 99, 235, 0.05);">')
        // Paragraph Styles: Force explicit margin/spacing for "double line break" visual effect
        .replace(/<p>/g, `<p style="margin-bottom: 32px; line-height: 1.8;${blogCategory.includes('리뷰') ? ' color: #000000; margin-bottom: 16px;' : ''}">`)
        // Ensure a physical blank line is preserved in rich text editors by adding an empty paragraph
        .replace(/<\/p>/g, '</p><p><br></p>');

    if (blogCategory.includes('리뷰')) {
        styledHtml = `<div style="text-align: center; word-break: keep-all; color: #000000; font-family: sans-serif;">${styledHtml}</div>`;
    }

    const blob = new Blob([styledHtml], { type: 'text/html' });
    const textBlob = new Blob([content], { type: 'text/plain' });
    
    try {
        await navigator.clipboard.write([
            new ClipboardItem({ 
                'text/html': blob,
                'text/plain': textBlob 
            })
        ]);
        alert('본문이 복사되었습니다.\n블로그 에디터에 붙여넣으세요.');
    } catch (err) {
        console.error('Clipboard write failed', err);
        alert('복사에 실패했습니다. 브라우저 권한을 확인해주세요.');
    }
  };

  // --- Image Download (Individual PNG Loop) ---
  const downloadAllImagesAsPng = async () => {
      const imagesToDownload: { url: string, name: string }[] = [];
      
      // Collect all images
      if (thumbnail?.url) imagesToDownload.push({ url: thumbnail.url, name: 'thumbnail.png' });
      generatedImages.forEach((img, idx) => {
          if (img.url) imagesToDownload.push({ url: img.url, name: `image_${idx + 1}.png` });
      });
      launderedImages.forEach((url, idx) => {
          imagesToDownload.push({ url, name: `laundered_${idx + 1}.png` });
      });

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
    <div className="flex items-center justify-between mb-8 px-2 sm:px-4 max-w-5xl mx-auto overflow-x-auto no-scrollbar">
      {steps.map((s, idx) => {
        const isActive = s.id === currentStep;
        const isPast = steps.findIndex(x => x.id === currentStep) > idx;
        const isProcessing = isAutoRunning && isActive;

        return (
          <div key={s.id} className="flex flex-col items-center relative z-10 flex-1 min-w-[60px]">
            <div 
              className={`w-8 h-8 sm:w-12 sm:h-12 rounded-full flex items-center justify-center text-sm sm:text-xl transition-all duration-300 border-2 
                ${isActive ? 'bg-indigo-600 text-white border-indigo-500 scale-110 shadow-lg shadow-indigo-500/30' : 
                  isPast ? 'bg-emerald-600 text-white border-emerald-500' : 'bg-slate-800 text-slate-500 border-slate-700'}`}
            >
              {isProcessing ? (
                  <span className="animate-spin text-sm sm:text-xl">⚡️</span>
              ) : isPast ? (
                  '✓' 
              ) : (
                  s.icon
              )}
            </div>
            <span className={`mt-2 text-[8px] sm:text-xs font-medium text-center ${isActive ? 'text-indigo-400' : isPast ? 'text-emerald-400' : 'text-slate-500'} ${isProcessing ? 'animate-pulse' : ''}`}>
              {s.label}
            </span>
            {idx < steps.length - 1 && (
                <div className={`absolute top-4 sm:top-6 left-[60%] w-[80%] h-0.5 -z-10 ${isPast ? 'bg-emerald-600' : 'bg-slate-700'}`} />
            )}
          </div>
        );
      })}
    </div>
  );

  return (
    <div className="flex flex-col h-full bg-slate-950 overflow-hidden">
        {/* Step Header */}
        <div className="bg-slate-900 border-b border-slate-800 pt-8 pb-4 shadow-sm z-20 flex-none relative">
            <div className="absolute left-4 sm:left-8 top-4 sm:top-8 flex gap-2 z-30">
                {currentStep !== 'keyword' && (
                    <button 
                        onClick={handleBackStep}
                        className="text-slate-400 hover:text-white flex items-center gap-1 sm:gap-2 text-[10px] sm:text-sm font-medium bg-slate-800 px-2 sm:px-3 py-1 sm:py-1.5 rounded-lg border border-slate-700 transition-colors"
                    >
                        <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
                        이전
                    </button>
                )}
                <button 
                    onClick={handleForwardStep}
                    className="text-slate-400 hover:text-white flex items-center gap-1 sm:gap-2 text-[10px] sm:text-sm font-medium bg-slate-800 px-2 sm:px-3 py-1 sm:py-1.5 rounded-lg border border-slate-700 transition-colors"
                >
                    다음
                    <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg>
                </button>
            </div>
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
                        <div className="text-right text-xs text-slate-400">
                            <span className="text-red-500">*</span> 은 필수항목입니다.
                        </div>
                        
                        {/* Platform Input */}
                        <div className="space-y-2">
                            <label className="text-sm font-bold text-slate-300 ml-1">블로그 플랫폼 <span className="text-red-500">*</span></label>
                            <select
                                value={blogPlatform}
                                onChange={(e) => setBlogPlatform(e.target.value)}
                                className="w-full p-4 rounded-xl bg-slate-800 border border-slate-700 focus:ring-2 focus:ring-indigo-500 outline-none text-white text-lg shadow-inner"
                            >
                                <option value="">플랫폼을 선택해주세요 (필수)</option>
                                <option value="네이버">네이버</option>
                                <option value="티스토리">티스토리</option>
                                <option value="구글 블로거">구글 블로거</option>
                                <option value="워드프레스">워드프레스</option>
                                <option value="벨로그">벨로그</option>
                                <option value="브런치">브런치</option>
                                <option value="미디엄">미디엄</option>
                                <option value="기타">기타</option>
                            </select>
                        </div>

                        {/* Category Input */}
                        <div className="space-y-2">
                            <label className="text-sm font-bold text-slate-300 ml-1">블로그 분류 <span className="text-red-500">*</span></label>
                            <select
                                value={blogCategory}
                                onChange={(e) => {
                                    const newCat = e.target.value;
                                    setBlogCategory(newCat);
                                    if (newCat.includes('리뷰')) {
                                        setSkipImageGeneration(true);
                                    }
                                }}
                                className="w-full p-4 rounded-xl bg-slate-800 border border-slate-700 focus:ring-2 focus:ring-indigo-500 outline-none text-white text-lg shadow-inner"
                            >
                                <option value="">분류를 선택해주세요 (필수)</option>
                                <optgroup label="리뷰/후기">
                                    <option value="제품 리뷰">제품 리뷰</option>
                                    <option value="제품리뷰(서술형)">제품리뷰(서술형)</option>
                                    <option value="맛집 리뷰">맛집 리뷰</option>
                                    <option value="뷰티 리뷰">뷰티 리뷰</option>
                                    <option value="여행 리뷰">여행 리뷰</option>
                                    <option value="도서/영화 리뷰">도서/영화 리뷰</option>
                                    <option value="공연/전시">공연/전시</option>
                                    <option value="IT/테크 기기 리뷰">IT/테크 기기 리뷰</option>
                                    <option value="자동차/바이크 리뷰">자동차/바이크 리뷰</option>
                                    <option value="기타 리뷰">기타 리뷰</option>
                                </optgroup>
                                <optgroup label="홍보/비즈니스">
                                    <option value="브랜드 홍보">브랜드 홍보</option>
                                    <option value="전문직 홍보">전문직 홍보 (변호사, 세무사 등)</option>
                                    <option value="병원 홍보">병원 홍보</option>
                                    <option value="학원 홍보">학원 홍보</option>
                                    <option value="교육 홍보">교육 홍보</option>
                                    <option value="소상공인 홍보">소상공인 홍보</option>
                                    <option value="부동산/분양 홍보">부동산/분양 홍보</option>
                                    <option value="인테리어/시공 홍보">인테리어/시공 홍보</option>
                                    <option value="B2B 기업 홍보">B2B 기업 홍보</option>
                                </optgroup>
                                <optgroup label="정보/라이프스타일">
                                    <option value="일상/생각">일상/생각</option>
                                    <option value="육아/결혼">육아/결혼</option>
                                    <option value="요리/레시피">요리/레시피</option>
                                    <option value="인테리어/DIY">인테리어/DIY</option>
                                    <option value="디자인">디자인</option>
                                    <option value="미술/디자인/예술">미술/디자인/예술</option>
                                    <option value="예술/문화">예술/문화</option>
                                    <option value="패션/스타일">패션/스타일</option>
                                    <option value="건강/운동">건강/운동</option>
                                    <option value="금융/재테크">금융/재테크</option>
                                    <option value="주식/투자">주식/투자</option>
                                    <option value="세금관련">세금관련</option>
                                    <option value="법률">법률</option>
                                    <option value="어학/외국어">어학/외국어</option>
                                    <option value="취미/게임">취미/게임</option>
                                    <option value="반려동물">반려동물</option>
                                    <option value="자기계발">자기계발</option>
                                    <option value="인문학">인문학</option>
                                    <option value="정치/뉴스">정치/뉴스</option>
                                    <option value="정부정책">정부정책</option>
                                    <option value="종교관련">종교관련</option>
                                    <option value="언어 및 맞춤법">언어 및 맞춤법</option>
                                    <option value="생활 및 살림">생활 및 살림</option>
                                    <option value="경제 및 비즈니스">경제 및 비즈니스</option>
                                    <option value="문화 및 에티켓">문화 및 에티켓</option>
                                    <option value="잡학 및 과학">잡학 및 과학</option>
                                    <option value="신조어 및 트렌드 리뷰">신조어 및 트렌드 리뷰</option>
                                    <option value="지식 백과 및 용어 사전">지식 백과 및 용어 사전</option>
                                    <option value="역사">역사</option>
                                    <option value="인물 리뷰/위인전">인물 리뷰/위인전</option>
                                    <option value="키워드 큐레이션">키워드 큐레이션</option>
                                </optgroup>
                            </select>
                        </div>

                        {/* Topic Input */}
                        <div className="space-y-2">
                            <label className="text-sm font-bold text-slate-300 ml-1">블로그 주제 (원하시는 주제를 자유롭게 작성해주세요.) <span className="text-red-500">*</span></label>
                            <input 
                                type="text" 
                                value={topic}
                                onChange={(e) => setTopic(e.target.value)}
                                placeholder="예: AI 수익화 전략"
                                className="w-full p-4 rounded-xl bg-slate-800 border border-slate-700 focus:ring-2 focus:ring-indigo-500 outline-none text-white text-lg shadow-inner"
                            />
                        </div>

                        {/* Blog Style Input */}
                        <div className="space-y-2">
                            <label className="text-sm font-bold text-slate-300 ml-1">블로그 스타일 <span className="text-red-500">*</span></label>
                            <select 
                                value={blogStyle}
                                onChange={(e) => setBlogStyle(e.target.value)}
                                className="w-full p-4 rounded-xl bg-slate-800 border border-slate-700 focus:ring-2 focus:ring-indigo-500 outline-none text-white text-lg shadow-inner appearance-none"
                            >
                                <option value="" disabled>블로그 스타일을 선택하세요</option>
                                <option value="전문가/정보전달형 (신뢰감, 논리적, 객관적)">전문가/정보전달형 (신뢰감, 논리적, 객관적)</option>
                                <option value="친근한 이웃형 (공감, 부드러움, 소통형)">친근한 이웃형 (공감, 부드러움, 소통형)</option>
                                <option value="감성 에세이형 (서정적, 감각적, 여운)">감성 에세이형 (서정적, 감각적, 여운)</option>
                                <option value="유머/재치형 (재미, 센스, 가벼운 톤)">유머/재치형 (재미, 센스, 가벼운 톤)</option>
                                <option value="리뷰/체험단형 (솔직함, 디테일, 경험 위주)">리뷰/체험단형 (솔직함, 디테일, 경험 위주)</option>
                                <option value="인터뷰/대화형 (문답형, 생동감, 현장감)">인터뷰/대화형 (문답형, 생동감, 현장감)</option>
                                <option value="스토리텔링형 (기승전결, 몰입감, 서사적)">스토리텔링형 (기승전결, 몰입감, 서사적)</option>
                                <option value="현장 밀착형 스토리텔링 (현장감, 신뢰, 파트너십)">현장 밀착형 스토리텔링 (현장감, 신뢰, 파트너십)</option>
                                <option value="팩트폭행/직설적 (단호함, 명쾌함, 사이다)">팩트폭행/직설적 (단호함, 명쾌함, 사이다)</option>
                                <option value="트렌디/MZ세대형 (유행어, 밈, 톡톡 튀는 톤)">트렌디/MZ세대형 (유행어, 밈, 톡톡 튀는 톤)</option>
                                <option value="일기/기록형 (솔직함, 개인적, 담백함)">일기/기록형 (솔직함, 개인적, 담백함)</option>
                                <option value="비즈니스/격식형 (정중함, 공식적, 깔끔함)">비즈니스/격식형 (정중함, 공식적, 깔끔함)</option>
                                <option value="비판적/분석형 (날카로움, 통찰력, 논쟁적)">비판적/분석형 (날카로움, 통찰력, 논쟁적)</option>
                            </select>
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-bold text-slate-300 ml-1">글자수</label>
                            <select 
                                value={wordCount}
                                onChange={(e) => setWordCount(e.target.value)}
                                className="w-full p-4 rounded-xl bg-slate-800 border border-slate-700 focus:ring-2 focus:ring-indigo-500 outline-none text-white text-lg shadow-inner appearance-none"
                            >
                                <option value="AI 추천 (자동)">AI 추천 (자동)</option>
                                <option value="500~1000자">500~1000자</option>
                                <option value="1000자~1500자">1000자~1500자</option>
                                <option value="1500자~2000자">1500자~2000자</option>
                                <option value="2000자~2500자">2000자~2500자</option>
                                <option value="2500자~3000자">2500자~3000자</option>
                            </select>
                        </div>

                        {/* Store & Service Inputs */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <label className="text-sm font-bold text-slate-300 ml-1">상호명 / 브랜드명</label>
                                <input 
                                    type="text" 
                                    value={storeName}
                                    onChange={(e) => setStoreName(e.target.value)}
                                    placeholder="예: 혁신 AI"
                                    className="w-full p-3 rounded-xl bg-slate-800 border border-slate-700 focus:ring-2 focus:ring-indigo-500 outline-none text-white"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-bold text-slate-300 ml-1">판매 제품 / 서비스</label>
                                <input 
                                    type="text" 
                                    value={salesService}
                                    onChange={(e) => setSalesService(e.target.value)}
                                    placeholder="예: 혁신적인 AI 수익화 노하우"
                                    className="w-full p-3 rounded-xl bg-slate-800 border border-slate-700 focus:ring-2 focus:ring-indigo-500 outline-none text-white"
                                />
                            </div>
                        </div>

                        {/* Advanced Inputs */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <label className="text-sm font-bold text-slate-300 ml-1">타겟 고객층</label>
                                <input 
                                    type="text" 
                                    value={targetAudience}
                                    onChange={(e) => setTargetAudience(e.target.value)}
                                    placeholder="예: 2030 직장인, 30대 육아맘"
                                    className="w-full p-3 rounded-xl bg-slate-800 border border-slate-700 focus:ring-2 focus:ring-indigo-500 outline-none text-white"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-bold text-slate-300 ml-1">서브 키워드</label>
                                <input 
                                    type="text" 
                                    value={secondaryKeywords}
                                    onChange={(e) => setSecondaryKeywords(e.target.value)}
                                    placeholder="예: 강남역 맛집, 데이트 코스 추천"
                                    className="w-full p-3 rounded-xl bg-slate-800 border border-slate-700 focus:ring-2 focus:ring-indigo-500 outline-none text-white"
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <label className="text-sm font-bold text-slate-300 ml-1">행동 유도 (CTA) 및 연락처/링크</label>
                                <input 
                                    type="text" 
                                    value={cta}
                                    onChange={(e) => setCta(e.target.value)}
                                    placeholder="예: 네이버 예약하기 (링크), 010-1234-5678"
                                    className="w-full p-3 rounded-xl bg-slate-800 border border-slate-700 focus:ring-2 focus:ring-indigo-500 outline-none text-white"
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <div className="flex items-center gap-2 mb-1">
                                <input 
                                    type="checkbox" 
                                    id="includeFaq"
                                    checked={includeFaq}
                                    onChange={(e) => setIncludeFaq(e.target.checked)}
                                    className="w-4 h-4 text-indigo-600 bg-slate-800 border-slate-700 rounded focus:ring-indigo-500 cursor-pointer"
                                />
                                <label htmlFor="includeFaq" className="text-sm font-bold text-slate-300 cursor-pointer">자주 묻는 질문 (FAQ) 추가</label>
                            </div>
                            <textarea 
                                value={faq}
                                onChange={(e) => setFaq(e.target.value)}
                                placeholder="고객들이 평소에 가장 많이 묻는 질문 1~2가지를 입력하세요."
                                className="w-full p-3 rounded-xl bg-slate-800 border border-slate-700 focus:ring-2 focus:ring-indigo-500 outline-none text-white h-20 resize-none"
                            />
                        </div>

                        {/* Reference Note */}
                        <div className="space-y-2">
                            <label className="text-sm font-bold text-slate-300 ml-1">참고 노트</label>
                            <textarea 
                                value={referenceNote}
                                onChange={(e) => setReferenceNote(e.target.value)}
                                placeholder="추가적인 요청사항이나 참고할 내용을 입력하세요."
                                className="w-full p-3 rounded-xl bg-slate-800 border border-slate-700 focus:ring-2 focus:ring-indigo-500 outline-none text-white h-20 resize-none"
                            />
                        </div>

                        {/* Must Include Content */}
                        <div className="space-y-2">
                            <label className="text-sm font-bold text-slate-300 ml-1">꼭 들어가야 할 내용</label>
                            <textarea 
                                value={mustIncludeContent}
                                onChange={(e) => setMustIncludeContent(e.target.value)}
                                placeholder="블로그 본문에 반드시 포함되어야 하는 특정 문구, 정보, 이벤트 내용 등을 입력하세요."
                                className="w-full p-3 rounded-xl bg-slate-800 border border-slate-700 focus:ring-2 focus:ring-indigo-500 outline-none text-white h-20 resize-none"
                            />
                        </div>

                        {/* Reference Files (New Section) */}
                        <div className="space-y-2">
                            <label className="text-sm font-bold text-slate-300 ml-1">참고할 파일 (PDF, DOCX)</label>
                            <input 
                                type="file" 
                                accept=".pdf,.docx"
                                multiple
                                onChange={(e) => {
                                    if (e.target.files) {
                                        setReferenceFiles(Array.from(e.target.files));
                                    } else {
                                        setReferenceFiles([]);
                                    }
                                }}
                                className="w-full p-3 rounded-xl bg-slate-800 border border-slate-700 focus:ring-2 focus:ring-indigo-500 outline-none text-white file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100"
                            />
                            {referenceFiles.length > 0 && (
                                <p className="text-xs text-slate-400 ml-1 mt-1">{referenceFiles.length}개의 파일이 선택되었습니다.</p>
                            )}
                        </div>

                        {/* Service Price Inputs */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <label className="text-sm font-bold text-slate-300 ml-1">서비스 금액표 이미지 (다중 선택 가능)</label>
                                <input 
                                    type="file" 
                                    accept="image/*"
                                    multiple
                                    onChange={(e) => {
                                        if (e.target.files) {
                                            setServicePriceFiles(Array.from(e.target.files));
                                        } else {
                                            setServicePriceFiles([]);
                                        }
                                    }}
                                    className="w-full p-3 rounded-xl bg-slate-800 border border-slate-700 focus:ring-2 focus:ring-indigo-500 outline-none text-white file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100"
                                />
                                {servicePriceFiles.length > 0 && (
                                    <p className="text-xs text-slate-400 ml-1 mt-1">{servicePriceFiles.length}개의 파일이 선택되었습니다.</p>
                                )}
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-bold text-slate-300 ml-1">서비스 금액 작성</label>
                                <input 
                                    type="text" 
                                    value={servicePriceText}
                                    onChange={(e) => setServicePriceText(e.target.value)}
                                    placeholder="예: 아메리카노/4500원, 카페라떼/5000원"
                                    className="w-full p-3 rounded-xl bg-slate-800 border border-slate-700 focus:ring-2 focus:ring-indigo-500 outline-none text-white"
                                />
                            </div>
                        </div>

                        {/* Benchmarking Text (New) */}
                        <div className="space-y-2">
                            <div className="flex items-center justify-between">
                                <label className="text-sm font-bold text-slate-300 ml-1">벤치마킹 원고</label>
                                <div className="flex gap-2">
                                    <input 
                                        type="file" 
                                        accept=".pdf,.txt,.docx" 
                                        onChange={handleFileUpload} 
                                        className="hidden" 
                                        id="benchmarking-file-upload"
                                    />
                                    <label 
                                        htmlFor="benchmarking-file-upload"
                                        className="cursor-pointer text-xs px-3 py-1.5 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors font-medium flex items-center gap-1"
                                    >
                                        파일 첨부
                                    </label>
                                    <a 
                                        href="https://docs.google.com/document/d/1UUi9NaY9NUY585E5lt-Hx9Sjz9YWlVFhwX-yrDcGAoM/edit?usp=sharing" 
                                        target="_blank" 
                                        rel="noopener noreferrer"
                                        className="text-xs px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors font-medium flex items-center gap-1"
                                    >
                                        드래그프리 설치 및 사용 매뉴얼
                                    </a>
                                </div>
                            </div>
                            <p className="text-xs text-slate-400 ml-1 mb-2">
                                벤치마킹 원고는 내가 카피하고 싶은 원고를 선택한 블로그 분류, 주제, 상호명 / 브랜드명, 판매 제품 / 서비스, USP에 맞게끔 수정하여 블로그 원고 작성시 참고하는 기능입니다.
                            </p>
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

                        {/* Image Style Selector */}
                        <div className="pt-4 border-t border-slate-800 space-y-3">
                            <label className="text-xs font-bold text-slate-300 block">🎨 이미지 스타일 선택</label>
                            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 lg:grid-cols-10 gap-2">
                                {IMAGE_STYLES.map((style) => (
                                    <button
                                        key={style.id}
                                        onClick={() => setSelectedImageStyle(style.id)}
                                        className={`px-2 py-2 rounded-lg text-[10px] font-bold transition-all border text-center ${
                                            selectedImageStyle === style.id
                                                ? 'bg-indigo-600 text-white border-indigo-500 shadow-lg shadow-indigo-500/20'
                                                : 'bg-slate-800 text-slate-400 border-slate-700 hover:bg-slate-700'
                                        }`}
                                    >
                                        {style.name}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Image Asset Inputs */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t border-slate-800">
                             {/* Image Generation Model Selector */}
                             <div className="space-y-2">
                                 <label className="text-xs font-bold text-slate-300 block">🎨 이미지 생성 모델</label>
                                 <div className="grid grid-cols-1 gap-2">
                                     {IMAGE_MODELS.map((model) => (
                                         <button
                                             key={model.id}
                                             onClick={() => setSelectedImageModel(model.id)}
                                             className={`px-3 py-2 rounded-lg text-xs font-bold transition-all border text-left ${
                                                 selectedImageModel === model.id
                                                     ? 'bg-indigo-600 text-white border-indigo-500 shadow-lg shadow-indigo-500/20'
                                                     : 'bg-slate-800 text-slate-400 border-slate-700 hover:bg-slate-700'
                                             }`}
                                         >
                                             <div className="flex justify-between items-center">
                                                 <span>{model.name}</span>
                                             </div>
                                             <div className="text-[10px] opacity-70 mt-1">{model.desc}</div>
                                         </button>
                                     ))}
                                 </div>
                             </div>
                             {/* Logo */}
                             <div className="space-y-2">
                                 <label className="text-xs font-bold text-teal-400 block">🖼️ 로고 이미지 (제한 없음)</label>
                                 <input 
                                    type="file" 
                                    multiple
                                    accept="image/*"
                                    onChange={(e) => {
                                        if (e.target.files) {
                                            setLogoFiles(prev => [...prev, ...Array.from(e.target.files!)]);
                                        }
                                    }}
                                    className="w-full text-xs text-slate-400 file:mr-2 file:py-1 file:px-2 file:rounded-full file:border-0 file:text-xs file:bg-teal-900/30 file:text-teal-300 hover:file:bg-teal-900"
                                 />
                                 {logoFiles.length > 0 && <p className="text-[10px] text-teal-300 truncate">{logoFiles.length}장 선택됨</p>}
                             </div>
                             {/* Person */}
                             <div className="space-y-2">
                                 <label className="text-xs font-bold text-purple-400 block">👤 인물 이미지 (제한 없음)</label>
                                 <input 
                                    type="file" 
                                    multiple
                                    accept="image/*"
                                    onChange={(e) => {
                                        if (e.target.files) {
                                            setFaceImageFiles(prev => [...prev, ...Array.from(e.target.files!)]);
                                        }
                                    }}
                                    className="w-full text-xs text-slate-400 file:mr-2 file:py-1 file:px-2 file:rounded-full file:border-0 file:text-xs file:bg-purple-900/30 file:text-purple-300 hover:file:bg-purple-900"
                                 />
                                 {faceImageFiles.length > 0 && <p className="text-[10px] text-purple-300 truncate">{faceImageFiles.length}장 선택됨</p>}
                             </div>
                             {/* Reference */}
                             <div className="space-y-2">
                                 <label className="text-xs font-bold text-slate-300 block">📁 참고 이미지 (제한 없음)</label>
                                 <input 
                                    type="file" 
                                    multiple
                                    accept="image/*"
                                    onChange={handleContextImagesChange}
                                    className="w-full text-xs text-slate-400 file:mr-2 file:py-1 file:px-2 file:rounded-full file:border-0 file:text-xs file:bg-slate-700 file:text-slate-300 hover:file:bg-slate-600"
                                 />
                                 {contextImageFiles.length > 0 && <p className="text-[10px] text-slate-300">{contextImageFiles.length}장 선택됨</p>}
                             </div>
                             {/* Laundered */}
                             <div className="space-y-2">
                                 <label className="text-xs font-bold text-amber-400 block">🧼 세탁 이미지 (제한 없음)</label>
                                 <input 
                                    type="file" 
                                    multiple
                                    accept="image/*"
                                    onChange={(e) => {
                                        if (e.target.files) {
                                            setLaunderedImageFiles(prev => [...prev, ...Array.from(e.target.files!)]);
                                        }
                                    }}
                                    className="w-full text-xs text-slate-400 file:mr-2 file:py-1 file:px-2 file:rounded-full file:border-0 file:text-xs file:bg-amber-900/30 file:text-amber-300 hover:file:bg-amber-900"
                                 />
                                 <p className="text-[9px] text-slate-500 leading-tight">첨부한 이미지의 값을 변경하여 그대로 다시 출력합니다. 이미지 변형은 절대 하지 않습니다.</p>
                                 {launderedImageFiles.length > 0 && <p className="text-[10px] text-amber-300 truncate">{launderedImageFiles.length}장 선택됨</p>}
                             </div>
                             {/* Skip Image Generation */}
                             <div className="space-y-4 flex flex-col p-4 bg-slate-900/80 rounded-2xl border border-slate-800 shadow-inner">
                                 <div className="flex items-center gap-3">
                                     <div className="relative flex items-center">
                                         <input 
                                            type="checkbox" 
                                            id="skipImageGeneration"
                                            checked={skipImageGeneration}
                                            onChange={(e) => setSkipImageGeneration(e.target.checked)}
                                            className="w-6 h-6 text-indigo-600 bg-slate-800 border-slate-700 rounded-lg focus:ring-indigo-500 cursor-pointer transition-all hover:scale-110"
                                         />
                                     </div>
                                     <div className="flex flex-col">
                                         <label htmlFor="skipImageGeneration" className="text-base font-black text-white cursor-pointer">
                                             이미지 생성하지 않음
                                         </label>
                                         <p className="text-xs text-slate-400 font-medium mt-0.5">이미지 생성을 안하고 싶다면 해당 버튼을 체크하세요.</p>
                                     </div>
                                 </div>
                             </div>

                             {/* Image Count Selection */}
                             {!skipImageGeneration && (
                                 <div className="space-y-3 p-4 bg-slate-900/80 rounded-2xl border border-slate-800 shadow-inner">
                                     <label className="text-sm font-bold text-slate-300 flex items-center gap-2">
                                         <span className="text-lg">🖼️</span> 이미지 생성 개수 선택
                                     </label>
                                     <div className="flex flex-wrap gap-2">
                                         {[
                                             { label: 'AI추천', value: 0 },
                                             { label: '1개', value: 1 },
                                             { label: '3개', value: 3 },
                                             { label: '5개', value: 5 },
                                             { label: '10개', value: 10 }
                                         ].map((opt) => (
                                             <button
                                                 key={opt.value}
                                                 onClick={() => {
                                                     setIsAutoImageCount(opt.value === 0);
                                                     setImageCount(opt.value);
                                                 }}
                                                 className={`px-4 py-2 rounded-xl text-sm font-bold transition-all border ${
                                                     (isAutoImageCount && opt.value === 0) || (!isAutoImageCount && imageCount === opt.value)
                                                     ? 'bg-indigo-600 text-white border-indigo-400 shadow-lg shadow-indigo-900/40 scale-105'
                                                     : 'bg-slate-800 text-slate-400 border-slate-700 hover:bg-slate-700 hover:text-white'
                                                 }`}
                                             >
                                                 {opt.label}
                                             </button>
                                         ))}
                                     </div>
                                     <p className="text-[10px] text-slate-500">생성할 이미지의 개수를 선택하세요. AI추천은 본문 길이에 맞춰 적절한 개수를 생성합니다.</p>
                                 </div>
                             )}
                         </div>
                    </div>

                    {/* Action Area */}
                    <div className="pt-4 border-t border-slate-800">
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 items-stretch">
                          {/* 1. Discover Keywords */}
                          <button 
                            onClick={handleDiscoverKeywords}
                            disabled={isGenerating || !topic}
                            className="bg-gradient-to-br from-indigo-600 to-purple-700 text-white p-6 rounded-3xl font-bold hover:shadow-2xl hover:shadow-indigo-500/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed group text-left flex flex-col justify-between min-h-[180px] relative overflow-hidden border border-indigo-400/30 ring-1 ring-indigo-500/20"
                          >
                             <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity transform group-hover:scale-110 duration-500">
                                <svg className="w-24 h-24" fill="currentColor" viewBox="0 0 24 24"><path d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                             </div>
                             <div className="relative z-10">
                                 <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center text-2xl mb-4 backdrop-blur-sm">🔍</div>
                                 <h3 className="text-xl font-bold tracking-tight mb-2">키워드 발굴하기</h3>
                                 <p className="text-xs text-indigo-100 font-normal opacity-80 leading-relaxed">AI가 주제를 분석하여 황금 키워드를 찾아드립니다.</p>
                             </div>
                             {isGenerating && (
                                <div className="absolute inset-0 bg-black/20 backdrop-blur-[1px] flex items-center justify-center z-20">
                                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
                                </div>
                             )}
                          </button>
                          
                          {/* 2. Manual Keyword Start */}
                          <div className="bg-slate-800/60 p-6 rounded-3xl border border-slate-700/50 hover:border-emerald-500/30 hover:bg-slate-800 flex flex-col justify-between shadow-lg group transition-all min-h-[180px] relative overflow-hidden">
                               <div className="relative z-10">
                                   <div className="w-12 h-12 bg-emerald-500/20 rounded-xl flex items-center justify-center text-2xl mb-4 text-emerald-400">⚡️</div>
                                   <h3 className="text-xl font-bold text-white tracking-tight mb-2">원하는 키워드로 시작</h3>
                                   <p className="text-xs text-slate-400 font-medium mb-4">직접 입력한 키워드로 작성합니다.</p>
                               </div>
                               <div className="relative z-10 flex gap-2">
                                    <input 
                                        type="text" 
                                        value={manualKeyword}
                                        onChange={(e) => setManualKeyword(e.target.value)}
                                        placeholder="키워드 입력"
                                        className="flex-1 bg-slate-900 border border-slate-600 rounded-xl px-3 text-sm text-white placeholder-slate-500 focus:border-emerald-500 outline-none transition-all"
                                        onKeyDown={(e) => e.key === 'Enter' && handleManualStart()} 
                                    />
                                   <button 
                                      onClick={handleManualStart}
                                      className="bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-2 rounded-xl font-bold text-sm transition-all shadow-lg shadow-emerald-900/20"
                                   >
                                      Go
                                   </button>
                               </div>
                          </div>

                          {/* 3. Start with Blog Topic */}
                          <button 
                            onClick={() => {
                                if (!topic) {
                                    alert("블로그 주제를 먼저 입력해주세요.");
                                    return;
                                }
                                runAutomationSequence(topic);
                            }}
                            className="bg-slate-800/60 p-6 rounded-3xl border border-slate-700/50 hover:border-blue-500/30 hover:bg-slate-800 flex flex-col justify-between shadow-lg group transition-all min-h-[180px] relative overflow-hidden text-left"
                          >
                             <div className="relative z-10">
                                 <div className="w-12 h-12 bg-blue-500/20 rounded-xl flex items-center justify-center text-2xl mb-4 text-blue-400">📝</div>
                                 <h3 className="text-xl font-bold text-white tracking-tight mb-2">블로그 주제로 바로 시작하기</h3>
                                 <p className="text-xs text-slate-400 font-medium leading-relaxed">입력한 주제를 바탕으로 즉시 원고 작성을 시작합니다.</p>
                             </div>
                          </button>

                          {/* 4. One-Click Automation */}
                          <button 
                            onClick={() => {
                                if (!topic) {
                                    alert("블로그 주제를 먼저 입력해주세요.");
                                    return;
                                }
                                runAutomationSequence(topic, true);
                            }}
                            className="bg-gradient-to-br from-amber-500 to-orange-600 p-6 rounded-3xl border border-amber-400/30 hover:shadow-2xl hover:shadow-orange-500/40 transition-all group text-left flex flex-col justify-between min-h-[180px] relative overflow-hidden animate-pulse-subtle"
                          >
                             <div className="absolute top-0 right-0 p-4 opacity-20 group-hover:opacity-30 transition-opacity transform group-hover:scale-110 duration-500">
                                <span className="text-6xl">🚀</span>
                             </div>
                             <div className="relative z-10">
                                 <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center text-2xl mb-4 backdrop-blur-sm">🤖</div>
                                 <h3 className="text-xl font-bold text-white tracking-tight mb-2">원클릭 자동화 진행하기</h3>
                                 <p className="text-xs text-amber-50 font-normal opacity-90 leading-relaxed">주제 입력부터 최종 결과물까지 AI가 한 번에 해결합니다.</p>
                             </div>
                          </button>
                        </div>
                    </div>

                    {/* Keywords List */}
                    {keywords.length > 0 && (
                        <div className="grid grid-cols-1 gap-4 mt-12 animate-fade-in-up border-t border-slate-800 pt-8">
                          <h3 className="text-xl font-bold text-white mb-4">추천 키워드 분석 결과</h3>
                          {keywords.map((k, idx) => (
                            <div 
                              key={idx}
                              className="bg-slate-800 p-6 rounded-2xl border border-slate-700 transition-all hover:bg-slate-750 group relative overflow-hidden shadow-md"
                            >
                              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-4">
                                <div className="flex items-center gap-3">
                                    <span className="text-2xl font-bold text-white">{k.keyword}</span>
                                    <span className="px-2 py-1 rounded bg-indigo-900 text-indigo-300 text-xs">적합도 {k.suitabilityScore}%</span>
                                </div>
                                <div className="flex gap-2 w-full md:w-auto">
                                    <button 
                                        onClick={() => runAutomationSequence(k.keyword)}
                                        className="flex-1 md:flex-none px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-xl text-sm font-bold transition-all border border-slate-600"
                                    >
                                        수동으로 진행하기
                                    </button>
                                    <button 
                                        onClick={() => runAutomationSequence(k.keyword, true)}
                                        className="flex-1 md:flex-none px-4 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white rounded-xl text-sm font-bold transition-all shadow-lg shadow-indigo-500/20 flex items-center justify-center gap-2 animate-shine"
                                    >
                                        <span>🚀</span>
                                        <span>원클릭 자동화</span>
                                    </button>
                                </div>
                              </div>
                              <p className="text-slate-400 text-sm">{k.reason}</p>
                            </div>
                          ))}
                        </div>
                    )}
                    {isStepComplete && (
                        <div className="flex justify-center gap-4 pt-8">
                            <button 
                                onClick={handleNextStep}
                                className="px-8 py-4 bg-indigo-600 hover:bg-indigo-500 text-white rounded-2xl font-black text-xl transition-all shadow-xl shadow-indigo-500/30 flex items-center gap-3 animate-bounce"
                            >
                                <span>다음 단계로 이동</span>
                                <span className="text-2xl">→</span>
                            </button>
                        </div>
                    )}
                  </div>
                )}

                {/* Step 2: USP */}
                {currentStep === 'usp' && (
                    <div className="animate-fade-in space-y-6 pb-20">
                        <div className="flex justify-between items-center">
                            <h2 className="text-2xl font-bold text-white">USP 도출 중 ({Math.round(stepProgress)}%)</h2>
                            <span className="animate-pulse text-indigo-400 font-bold">AI가 최적의 USP를 도출하고 있습니다...</span>
                        </div>
                        <div className="bg-slate-800 p-8 rounded-3xl border border-slate-700 shadow-xl">
                            <div className="flex items-center justify-between mb-6">
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 bg-indigo-600 rounded-full flex items-center justify-center text-2xl">🎯</div>
                                    <div>
                                        <h3 className="text-xl font-bold text-white">전략적 USP 도출</h3>
                                        <p className="text-slate-400 text-sm">키워드 분석 결과를 바탕으로 차별화된 소구점을 찾습니다.</p>
                                    </div>
                                </div>
                                {!isAutoRunning && (
                                    <button 
                                        onClick={handleRetryStep}
                                        className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-xl text-sm font-bold transition-all flex items-center gap-2"
                                    >
                                        <span>🔄</span>
                                        <span>다시 시작</span>
                                    </button>
                                )}
                            </div>
                            <div className="bg-slate-900/50 p-6 rounded-2xl border border-slate-700 min-h-[100px] text-lg text-indigo-100 leading-relaxed whitespace-pre-wrap">
                                {isStepComplete ? (
                                    <textarea
                                        value={postGoal}
                                        onChange={(e) => setPostGoal(e.target.value)}
                                        className="w-full bg-transparent border-none outline-none text-indigo-100 resize-none h-32"
                                        placeholder="USP를 수정할 수 있습니다."
                                    />
                                ) : (
                                    postGoal || <span className="text-slate-600 italic">USP를 작성 중입니다...</span>
                                )}
                            </div>
                        </div>
                        {isStepComplete && (
                            <div className="flex justify-center gap-4 pt-4">
                                <button 
                                    onClick={handleBackStep}
                                    className="px-8 py-4 bg-slate-800 hover:bg-slate-700 text-white rounded-2xl font-bold text-xl transition-all border border-slate-700 shadow-xl flex items-center gap-3"
                                >
                                    <span className="text-2xl">←</span>
                                    <span>이전 단계</span>
                                </button>
                                <button 
                                    onClick={handleNextStep}
                                    className="px-8 py-4 bg-indigo-600 hover:bg-indigo-500 text-white rounded-2xl font-black text-xl transition-all shadow-xl shadow-indigo-500/30 flex items-center gap-3 animate-bounce"
                                >
                                    <span>다음 단계로 이동</span>
                                    <span className="text-2xl">→</span>
                                </button>
                            </div>
                        )}
                    </div>
                )}

                {/* Step 3: Title */}
                {currentStep === 'title' && (
                    <div className="animate-fade-in space-y-6 pb-20">
                        <div className="flex justify-between items-center">
                            <h2 className="text-2xl font-bold text-white">제목 생성 중 ({Math.round(stepProgress)}%)</h2>
                            <span className="animate-pulse text-indigo-400 font-bold">AI가 최적화된 제목을 생성하고 있습니다...</span>
                        </div>
                        <div className="bg-slate-800 p-8 rounded-3xl border border-slate-700 shadow-xl">
                            <div className="flex items-center justify-between mb-6">
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 bg-emerald-600 rounded-full flex items-center justify-center text-2xl">📝</div>
                                    <div>
                                        <h3 className="text-xl font-bold text-white">최적화 제목 생성</h3>
                                        <p className="text-slate-400 text-sm">주제와 키워드가 강조된 제목을 제안합니다.</p>
                                    </div>
                                </div>
                                {!isAutoRunning && (
                                    <button 
                                        onClick={handleRetryStep}
                                        className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-xl text-sm font-bold transition-all flex items-center gap-2"
                                    >
                                        <span>🔄</span>
                                        <span>다시 시작</span>
                                    </button>
                                )}
                            </div>
                            <div className="space-y-4">
                                {titleOptions.length > 0 ? (
                                    titleOptions.map((t, idx) => (
                                        <div key={idx} className="bg-slate-900/50 p-4 rounded-xl border border-slate-700 text-emerald-100 font-medium text-xl">
                                            {t}
                                        </div>
                                    ))
                                ) : (
                                    <div className="space-y-4">
                                        <div className="h-12 bg-slate-700 rounded-xl w-full animate-pulse"></div>
                                    </div>
                                )}
                            </div>
                        </div>
                        <div className="flex justify-center gap-4 pt-4">
                            {(currentStep as string) !== 'keyword' && (
                                <button 
                                    onClick={handleBackStep}
                                    className="px-8 py-4 bg-slate-800 hover:bg-slate-700 text-white rounded-2xl font-bold text-xl transition-all border border-slate-700 shadow-xl flex items-center gap-3"
                                >
                                    <span className="text-2xl">←</span>
                                    <span>이전 단계</span>
                                </button>
                            )}
                            {isStepComplete && (
                                <button 
                                    onClick={handleNextStep}
                                    className="px-8 py-4 bg-emerald-600 hover:bg-emerald-500 text-white rounded-2xl font-black text-xl transition-all shadow-xl shadow-emerald-500/30 flex items-center gap-3 animate-bounce"
                                >
                                    <span>다음 단계로 이동</span>
                                    <span className="text-2xl">→</span>
                                </button>
                            )}
                        </div>
                    </div>
                )}

                {/* Step 4: Script */}
                {currentStep === 'script' && (
                    <div className="animate-fade-in space-y-6 pb-20">
                        <div className="flex justify-between items-center">
                            <h2 className="text-2xl font-bold text-white">원고 작성 중 ({Math.round(stepProgress)}%)</h2>
                            <div className="flex items-center gap-4">
                                {!isAutoRunning && (
                                    <button 
                                        onClick={handleRetryStep}
                                        className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-xl text-sm font-bold transition-all flex items-center gap-2"
                                    >
                                        <span>🔄</span>
                                        <span>다시 시작</span>
                                    </button>
                                )}
                                {isAutoRunning && <span className="animate-pulse text-indigo-400 font-bold">AI가 대본을 작성 중입니다... (자동 진행 중)</span>}
                            </div>
                        </div>
                        
                        <input value={title} onChange={(e) => setTitle(e.target.value)} className="w-full text-2xl font-bold bg-transparent border-b border-slate-700 p-2 text-white" />
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6 h-auto sm:h-[600px]">
                            <textarea value={outline} onChange={(e) => setOutline(e.target.value)} className="bg-slate-800 p-4 rounded-xl text-slate-300 resize-none border border-slate-700 min-h-[200px] sm:min-h-0" />
                            <textarea value={content} onChange={(e) => setContent(e.target.value)} className="bg-slate-800 p-4 rounded-xl text-slate-300 resize-none border border-slate-700 min-h-[300px] sm:min-h-0" />
                        </div>
                        <div className="flex justify-center gap-4 pt-4">
                            {(currentStep as string) !== 'keyword' && (
                                <button 
                                    onClick={handleBackStep}
                                    className="px-8 py-4 bg-slate-800 hover:bg-slate-700 text-white rounded-2xl font-bold text-xl transition-all border border-slate-700 shadow-xl flex items-center gap-3"
                                >
                                    <span className="text-2xl">←</span>
                                    <span>이전 단계</span>
                                </button>
                            )}
                            {isStepComplete && (
                                <button 
                                    onClick={handleNextStep}
                                    className="px-8 py-4 bg-blue-600 hover:bg-blue-500 text-white rounded-2xl font-black text-xl transition-all shadow-xl shadow-blue-500/30 flex items-center gap-3 animate-bounce"
                                >
                                    <span>다음 단계로 이동</span>
                                    <span className="text-2xl">→</span>
                                </button>
                            )}
                        </div>
                    </div>
                )}

                {/* Step 3: Images */}
                {currentStep === 'images' && (
                    <div className="animate-fade-in space-y-6 pb-20">
                        <div className="flex justify-between items-center">
                            <h2 className="text-2xl font-bold text-white">이미지 생성 중 ({Math.round(stepProgress)}%)</h2>
                            <div className="flex items-center gap-4">
                                {!isAutoRunning && (
                                    <button 
                                        onClick={handleRetryStep}
                                        className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-xl text-sm font-bold transition-all flex items-center gap-2"
                                    >
                                        <span>🔄</span>
                                        <span>다시 시작</span>
                                    </button>
                                )}
                                {isAutoRunning && <span className="animate-pulse text-indigo-400 font-bold">이미지 렌더링 중... (자동 진행 중)</span>}
                            </div>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                             {generatedImages.map((img, idx) => (
                                 <div key={idx} className="bg-slate-800 rounded-xl overflow-hidden border border-slate-700 mx-auto relative" style={{ width: '100%', maxWidth: '880px', height: 'auto', aspectRatio: '880/495' }}>
                                     <button
                                         onClick={() => {
                                             setEditingImageIndex(idx);
                                             setEditPrompt(img.prompt);
                                         }}
                                         className="absolute top-2 right-2 bg-indigo-600/80 hover:bg-indigo-600 text-white p-2 rounded-full shadow-lg backdrop-blur-sm transition-all z-10"
                                         title="이미지 수정"
                                     >
                                         ✏️
                                     </button>
                                     <div className="bg-slate-900 relative w-full h-full">
                                         {img.isLoading ? (
                                             <div className="absolute inset-0 flex items-center justify-center text-indigo-500">생성 중...</div>
                                         ) : img.error ? (
                                             <div className="absolute inset-0 flex items-center justify-center text-red-500 text-xs p-2 text-center">{img.error}</div>
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
                        <div className="flex justify-center gap-4 pt-4">
                            {(currentStep as string) !== 'keyword' && (
                                <button 
                                    onClick={handleBackStep}
                                    className="px-8 py-4 bg-slate-800 hover:bg-slate-700 text-white rounded-2xl font-bold text-xl transition-all border border-slate-700 shadow-xl flex items-center gap-3"
                                >
                                    <span className="text-2xl">←</span>
                                    <span>이전 단계</span>
                                </button>
                            )}
                            {isStepComplete && (
                                <button 
                                    onClick={handleNextStep}
                                    className="px-8 py-4 bg-indigo-600 hover:bg-indigo-500 text-white rounded-2xl font-black text-xl transition-all shadow-xl shadow-indigo-500/30 flex items-center gap-3 animate-bounce"
                                >
                                    <span>다음 단계로 이동</span>
                                    <span className="text-2xl">→</span>
                                </button>
                            )}
                        </div>
                    </div>
                )}

                {/* Step 4: Thumbnail */}
                {currentStep === 'thumbnail' && (
                    <div className="animate-fade-in space-y-6 flex flex-col items-center pb-20">
                        <div className="w-full flex justify-between items-center">
                            <h2 className="text-2xl font-bold text-white">썸네일 생성 중 ({Math.round(stepProgress)}%)</h2>
                            {!isAutoRunning && (
                                <button 
                                    onClick={handleRetryStep}
                                    className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-xl text-sm font-bold transition-all flex items-center gap-2"
                                >
                                    <span>🔄</span>
                                    <span>다시 시작</span>
                                </button>
                            )}
                        </div>
                        {isAutoRunning && <span className="animate-pulse text-indigo-400 font-bold mb-4">1:1 고해상도 썸네일 제작 중... (자동 진행 중)</span>}
                        <div className="aspect-square rounded-2xl overflow-hidden border-2 border-slate-700 shadow-2xl bg-slate-800 relative group w-96">
                                    {thumbnail?.url ? (
                                        <>
                                            <img src={thumbnail.url} className="w-full h-full object-cover" alt="Thumbnail" />
                                            <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-2">
                                                <a href={thumbnail.url} download="thumbnail.png" className="bg-white text-black px-4 py-2 rounded-lg font-bold text-sm hover:bg-slate-200 transition-colors w-32 text-center">다운로드</a>
                                                <button 
                                                    onClick={() => {
                                                        setEditingImageIndex(-1);
                                                        setEditPrompt(thumbnailPrompt);
                                                    }}
                                                    className="bg-indigo-600 text-white px-4 py-2 rounded-lg font-bold text-sm hover:bg-indigo-500 transition-colors w-32"
                                                >
                                                    수정하기
                                                </button>
                                                <button 
                                                    onClick={async () => {
                                                        setThumbnail(prev => prev ? {...prev, isLoading: true} : null);
                                                        try {
                                                            const modelToUse = selectedImageModel === 'gemini-3.1-flash-image-preview-no-text' ? 'gemini-3.1-flash-image-preview' : selectedImageModel;
                                                            const promptToUse = selectedImageModel === 'gemini-3.1-flash-image-preview-no-text' ? `${thumbnailPrompt}, no text, no words` : thumbnailPrompt;
                                                            const thumbUrl = await generateBlogImage(promptToUse, "1:1", await getImageRefs(), await getFaceRefs(), modelToUse);
                                                            setThumbnail({ prompt: thumbnailPrompt, context: '', url: thumbUrl, isLoading: false });
                                                        } catch (e) {
                                                            setThumbnail(prev => prev ? {...prev, isLoading: false, error: String(e)} : null);
                                                        }
                                                    }}
                                                    className="bg-emerald-600 text-white px-4 py-2 rounded-lg font-bold text-sm hover:bg-emerald-500 transition-colors w-32"
                                                    disabled={thumbnail?.isLoading}
                                                >
                                                    {thumbnail?.isLoading ? '이미지 다시 생성중입니다.' : '다시 만들기'}
                                                </button>
                                            </div>
                                        </>
                                    ) : thumbnail?.error ? (
                                        <div className="w-full h-full flex flex-col items-center justify-center text-red-500 text-sm p-4 text-center gap-2">
                                            <span>{thumbnail.error}</span>
                                            <button 
                                                onClick={async () => {
                                                    setThumbnail(prev => prev ? {...prev, isLoading: true} : null);
                                                    try {
                                                        const thumbUrl = await generateBlogImage(thumbnailPrompt, "1:1", await getImageRefs(), await getFaceRefs(), selectedImageModel);
                                                        setThumbnail({ prompt: thumbnailPrompt, context: '', url: thumbUrl, isLoading: false });
                                                    } catch (e) {
                                                        setThumbnail(prev => prev ? {...prev, isLoading: false, error: String(e)} : null);
                                                    }
                                                }}
                                                className="bg-indigo-600 text-white px-3 py-1.5 rounded font-bold hover:bg-indigo-500 transition-colors"
                                            >
                                                다시 생성
                                            </button>
                                        </div>
                                    ) : thumbnail?.isLoading ? (
                                        <div className="w-full h-full flex items-center justify-center text-indigo-500">생성 중...</div>
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center text-slate-500">대기</div>
                                    )}
                        </div>
                        <div className="flex justify-center gap-4 pt-8">
                            {(currentStep as string) !== 'keyword' && (
                                <button 
                                    onClick={handleBackStep}
                                    className="px-8 py-4 bg-slate-800 hover:bg-slate-700 text-white rounded-2xl font-bold text-xl transition-all border border-slate-700 shadow-xl flex items-center gap-3"
                                >
                                    <span className="text-2xl">←</span>
                                    <span>이전 단계</span>
                                </button>
                            )}
                            {isStepComplete && (
                                <button 
                                    onClick={handleNextStep}
                                    className="px-8 py-4 bg-amber-600 hover:bg-amber-500 text-white rounded-2xl font-black text-xl transition-all shadow-xl shadow-amber-500/30 flex items-center gap-3 animate-bounce"
                                >
                                    <span>최종 결과 확인하기</span>
                                    <span className="text-2xl">✨</span>
                                </button>
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
                                    onClick={handleBackStep}
                                    className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-sm font-medium transition-colors border border-slate-700"
                                >
                                    ← 이전 단계
                                </button>
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
                                    📋 본문 복사 (표/인용구 포함)
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
                                    {thumbnail?.url ? (
                                        <>
                                            <img src={thumbnail.url} className="w-full h-full object-cover" alt="Thumbnail" />
                                            <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-2">
                                                <a href={thumbnail.url} download="thumbnail.png" className="bg-white text-black px-4 py-2 rounded-lg font-bold text-sm hover:bg-slate-200 transition-colors w-32 text-center">다운로드</a>
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
                                    ) : thumbnail?.error ? (
                                        <div className="w-full h-full flex flex-col items-center justify-center text-red-500 text-sm p-4 text-center gap-2">
                                            <span>{thumbnail.error}</span>
                                            <button 
                                                onClick={() => {
                                                    setEditingImageIndex(-1);
                                                    setEditPrompt(thumbnailPrompt);
                                                }}
                                                className="bg-indigo-600 text-white px-3 py-1.5 rounded font-bold hover:bg-indigo-500 transition-colors"
                                            >
                                                다시 생성
                                            </button>
                                        </div>
                                    ) : thumbnail?.isLoading ? (
                                        <div className="w-full h-full flex items-center justify-center text-indigo-500">생성 중...</div>
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center text-slate-500">이미지 없음</div>
                                    )}
                                </div>
                            </div>
                            
                            {/* Blog Images */}
                            <div className="lg:col-span-2 space-y-3">
                                <h3 className="text-white font-bold text-lg flex items-center gap-2">
                                    <span>🖼️</span> 본문 삽입 이미지 ({generatedImages.filter(i => i.url).length}장)
                                </h3>
                                <div className="grid grid-cols-1 gap-8">
                                    {generatedImages.map((img, idx) => (
                                        <div key={idx} className="rounded-xl overflow-hidden border border-slate-700 bg-slate-800 relative group mx-auto shadow-2xl" style={{ width: '880px', height: '495px' }}>
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
                                                            <button 
                                                                onClick={async () => {
                                                                    setGeneratedImages(prev => {
                                                                        const newArr = [...prev];
                                                                        newArr[idx] = { ...newArr[idx], isLoading: true, error: undefined };
                                                                        return newArr;
                                                                    });
                                                                    try {
                                                                        const modelToUse = selectedImageModel === 'gemini-3.1-flash-image-preview-no-text' ? 'gemini-3.1-flash-image-preview' : selectedImageModel;
                                                                        const promptToUse = selectedImageModel === 'gemini-3.1-flash-image-preview-no-text' ? `${img.prompt}, no text, no words` : img.prompt;
                                                                        const url = await generateBlogImage(promptToUse, "16:9", await getImageRefs(), await getFaceRefs(), modelToUse);
                                                                        setGeneratedImages(prev => {
                                                                            const newArr = [...prev];
                                                                            newArr[idx] = { ...newArr[idx], url, isLoading: false };
                                                                            return newArr;
                                                                        });
                                                                    } catch (e) {
                                                                        setGeneratedImages(prev => {
                                                                            const newArr = [...prev];
                                                                            newArr[idx] = { ...newArr[idx], isLoading: false, error: String(e) };
                                                                            return newArr;
                                                                        });
                                                                    }
                                                                }}
                                                                className="bg-emerald-600 text-white px-3 py-1.5 rounded-lg font-bold text-xs hover:bg-emerald-500 transition-colors w-24"
                                                                disabled={img.isLoading}
                                                            >
                                                                {img.isLoading ? '이미지 다시 생성중입니다.' : '다시 만들기'}
                                                            </button>
                                                        </div>
                                                    </>
                                                ) : img.error ? (
                                                    <div className="w-full h-full flex flex-col items-center justify-center text-red-500 text-xs p-2 text-center gap-2">
                                                        <span>{img.error}</span>
                                                        <button 
                                                            onClick={() => {
                                                                setEditingImageIndex(idx);
                                                                setEditPrompt(img.prompt);
                                                            }}
                                                            className="bg-indigo-600 text-white px-2 py-1 rounded font-bold hover:bg-indigo-500 transition-colors"
                                                        >
                                                            다시 생성
                                                        </button>
                                                    </div>
                                                ) : img.isLoading ? (
                                                    <div className="w-full h-full flex items-center justify-center text-indigo-500 text-xs">생성 중...</div>
                                                ) : (
                                                    <div className="w-full h-full flex items-center justify-center text-slate-500 text-xs">대기 중</div>
                                                )}
                                            </div>
                                        ))}
                                </div>
                            </div>
                        </div>

                        {/* Laundered Images Gallery (New) */}
                        {launderedImages.length > 0 && (
                            <div className="space-y-3">
                                <h3 className="text-white font-bold text-lg flex items-center gap-2">
                                    <span>🧼</span> 세탁 완료 이미지 ({launderedImages.length}장)
                                </h3>
                                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                                    {launderedImages.map((url, idx) => (
                                        <div key={idx} className="aspect-square rounded-xl overflow-hidden border border-slate-700 bg-slate-800 relative group">
                                            <img src={url} className="w-full h-full object-cover" alt={`Laundered ${idx}`} />
                                            <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                                <a href={url} download={`laundered_${idx+1}.png`} className="bg-white text-black px-3 py-1.5 rounded-lg font-bold text-xs hover:bg-slate-200 transition-colors">다운로드</a>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Main Content */}
                        <div className="space-y-6">
                            {blogCategory.includes('리뷰') && (
                                <div className="bg-yellow-50 border-l-4 border-yellow-400 p-6 rounded-r-2xl shadow-md">
                                    <div className="flex items-start">
                                        <div className="flex-shrink-0 mt-0.5">
                                            <svg className="h-6 w-6 text-yellow-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                                            </svg>
                                        </div>
                                        <div className="ml-4">
                                            <h3 className="text-base font-bold text-yellow-800">주의사항</h3>
                                            <div className="mt-2 text-sm text-yellow-700 font-medium leading-relaxed">
                                                <p>
                                                    영업시간은 리서치 기반으로 작성됩니다. 하지만, 예전 영업시간으로 작성될수도 있으므로 체크후에 최신정보가 제대로 반영이 안되었다면 꼭! 수정해주시길 바랍니다.
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}
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

                                    .review-content p, .review-content li { color: #000000 !important; white-space: pre-wrap !important; }
                                    .review-content strong { color: #dc2626 !important; font-weight: bold !important; }
                                    .review-content em { color: #2563eb !important; font-style: normal !important; font-weight: bold !important; }
                                    .review-content strong em, .review-content em strong { background-color: #fef08a !important; color: #dc2626 !important; font-style: normal !important; font-weight: bold !important; }
                                    .review-content code { background-color: #fef08a !important; color: #2563eb !important; font-weight: bold !important; padding: 2px 4px; border-radius: 4px; }
                                    .review-content del { color: #8B4513 !important; text-decoration: none !important; font-weight: bold !important; }
                                 `}</style>
                                 <div className={`prose prose-lg max-w-none ${blogCategory.includes('리뷰') ? 'text-center break-keep review-content' : 'colored-content'}`} ref={resultContentRef}>
                                     <ReactMarkdown remarkPlugins={[remarkGfm]}>{content}</ReactMarkdown>
                                 </div>
                            </div>
                        </div>

                        {/* Hashtags Section */}
                        {hashtags && (
                            <div className="bg-slate-900 p-8 rounded-2xl border border-slate-800 shadow-xl space-y-4 animate-fade-in">
                                <div className="flex justify-between items-center">
                                    <h3 className="text-white font-bold text-lg flex items-center gap-2">
                                        <span>#️⃣</span> 추천 해시태그
                                    </h3>
                                    <button 
                                        onClick={() => copyToClipboard(hashtags)}
                                        className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-bold transition-colors shadow-lg shadow-indigo-500/20"
                                    >
                                        📋 해시태그 복사
                                    </button>
                                </div>
                                <div className="p-4 bg-slate-800 rounded-xl border border-slate-700 text-indigo-300 font-medium leading-relaxed break-all">
                                    {hashtags}
                                </div>
                            </div>
                        )}
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
                        <div className="flex justify-center pt-4 gap-4">
                            {currentStep !== 'keyword' && (
                                <button 
                                    onClick={handleBackStep}
                                    className="px-8 py-4 bg-slate-800 hover:bg-slate-700 text-white rounded-2xl font-bold text-xl transition-all border border-slate-700 shadow-xl flex items-center gap-3"
                                >
                                    <span className="text-2xl">←</span>
                                    <span>이전 단계</span>
                                </button>
                            )}
                            {isStepComplete && (
                                <button 
                                    onClick={handleNextStep}
                                    className="px-8 py-4 bg-blue-600 hover:bg-blue-500 text-white rounded-2xl font-black text-xl transition-all shadow-xl shadow-blue-500/30 flex items-center gap-3 animate-bounce"
                                >
                                    <span>다음 단계로 이동</span>
                                    <span className="text-2xl">→</span>
                                </button>
                            )}
                        </div>
                    </div>
                )}

            </div>
        </div>
    </div>
  );
};
