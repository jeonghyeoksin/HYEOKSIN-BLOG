export interface BlogPost {
  title: string;
  outline: string;
  content: string;
  keywords: string[];
  targetAudience: string;
}

export interface GeneratedImage {
  url: string | null;
  prompt: string;
  context: string;
  isLoading: boolean;
}

export interface KeywordSuggestion {
  rank: number;
  keyword: string;
  suitabilityScore: number;
  reason: string;
}

export type ViewState = 'dashboard' | 'studio';

export type StudioStep = 'keyword' | 'script' | 'images' | 'thumbnail' | 'result';

export interface WriterState {
  step: StudioStep;
  topic: string;
  selectedKeyword: string;
  outline: string;
  content: string;
  isGenerating: boolean;
  generatedImages: GeneratedImage[];
  thumbnail: GeneratedImage | null;
}