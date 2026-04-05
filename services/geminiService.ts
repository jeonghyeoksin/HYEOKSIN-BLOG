import { GoogleGenAI, GenerateContentResponse, Type, Part, ThinkingLevel } from "@google/genai";
import { KeywordSuggestion } from "../types";

// --- Helper: Fetch Naver Data ---
async function fetchNaverLocalData(query: string): Promise<string | null> {
  try {
    const res = await fetch(`/api/naver/local?query=${encodeURIComponent(query)}`);
    if (!res.ok) return null;
    const data = await res.json();
    if (data && data.items && data.items.length > 0) {
      return JSON.stringify(data.items, null, 2);
    }
    return null;
  } catch (e) {
    console.error("Failed to fetch Naver data:", e);
    return null;
  }
}

// --- Helper: withRetry for robust API calls ---
async function withRetry<T>(fn: () => Promise<T>, maxRetries = 3, minDelay = 10000, maxDelay = 30000, timeoutMs = 60000): Promise<T> {
  let lastError: any;
  for (let i = 0; i < maxRetries; i++) {
    try {
      // Create a timeout promise
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error("API 호출 시간 초과 (Timeout)")), timeoutMs)
      );

      // Race the actual function against the timeout
      return await Promise.race([fn(), timeoutPromise]) as T;
    } catch (error: any) {
      lastError = error;
      const errorMessage = (error.message || "").toLowerCase();
      
      // If it's a timeout, we might want to retry as well if it's not the last attempt
      const isTimeout = errorMessage.includes("timeout") || errorMessage.includes("시간 초과") || errorMessage.includes("deadline exceeded");

      // 503 (Overloaded), 429 (Quota), and other transient errors are retryable
      const isRetryable = 
        isTimeout ||
        errorMessage.includes("503") || 
        errorMessage.includes("overloaded") || 
        errorMessage.includes("수요가 급증") ||
        errorMessage.includes("429") ||
        errorMessage.includes("resource_exhausted") ||
        errorMessage.includes("unavailable") ||
        errorMessage.includes("service unavailable") ||
        errorMessage.includes("internal server error") ||
        errorMessage.includes("500") ||
        errorMessage.includes("bad gateway") ||
        errorMessage.includes("502") ||
        errorMessage.includes("504") ||
        errorMessage.includes("deadline exceeded") ||
        errorMessage.includes("transient");
      
      if (!isRetryable || i === maxRetries - 1) {
        throw error;
      }
      
      // Wait for a random delay between minDelay and maxDelay
      const delay = Math.random() * (maxDelay - minDelay) + minDelay;
      console.warn(`Gemini API call failed (attempt ${i + 1}/${maxRetries}). Retrying in ${Math.round(delay)}ms...`, error);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  throw lastError;
}

const getClient = () => {
  // 1. 로컬 저장소에서 사용자가 직접 입력한 키가 있는지 먼저 확인합니다.
  const localKey = typeof window !== 'undefined' ? localStorage.getItem('gemini_api_key') : null;
  
  // 2. 로컬 키가 없으면 플랫폼에서 주입한 API_KEY를 사용합니다.
  const apiKey = localKey || process.env.API_KEY;

  if (!apiKey) {
    throw new Error("API 키가 설정되지 않았습니다. API Key 설정을 완료해주세요.");
  }
  return new GoogleGenAI({ apiKey });
};

// Gemini 3 Flash Preview for High Availability, Speed & Higher Quota
const TEXT_MODEL = 'gemini-3-flash-preview';
// Gemini 3 Pro Image Preview for High-Quality Image Generation
const IMAGE_MODEL = 'gemini-3-pro-image-preview';

const handleApiError = (error: any, fallbackMessage: string): string => {
  console.error("Gemini API Error:", error);
  const errorMessage = (error.message || "").toLowerCase();

  if (errorMessage.includes("429") || errorMessage.includes("quota") || errorMessage.includes("resource_exhausted")) {
    return "API 사용량이 일일 할당량을 초과했습니다. 잠시 후 다시 시도하거나 다른 API 키를 사용해 주세요.";
  }
  if (errorMessage.includes("503") || errorMessage.includes("unavailable") || errorMessage.includes("overloaded")) {
    return "현재 AI 모델의 수요가 급증하여 일시적으로 서비스를 이용할 수 없습니다. 잠시 후 다시 시도해 주세요.";
  }
  if (errorMessage.includes("entity was not found") || errorMessage.includes("api_key_invalid")) {
    return "API 키가 올바르지 않거나 권한이 없습니다. 상단 'API Key 설정'에서 키를 다시 확인해주세요.";
  }
  return `${fallbackMessage}: ${error.message || "알 수 없는 오류"}`;
};

export const generateBlogIdeas = async (niche: string): Promise<string> => {
  try {
    const ai = getClient();
    
    const prompt = `
      You are a professional blog strategist.
      Generate 5 innovative and viral blog post ideas for the niche: "${niche}".
      The ideas should reflect current trends, technologies, and lifestyle changes.
      For each idea, provide a catchy title and a brief 1-sentence synopsis.
      Format the output as a clean numbered list.
      Korean language only.
    `;

    const response = await withRetry(() => ai.models.generateContent({
      model: TEXT_MODEL,
      contents: prompt,
      config: {
        temperature: 0.8,
        // thinkingLevel is the correct parameter for Gemini 3 series
        thinkingConfig: { thinkingLevel: ThinkingLevel.LOW }
      }
    }));

    return response.text || "아이디어를 생성할 수 없습니다.";
  } catch (error: any) {
    throw new Error(handleApiError(error, "블로그 아이디어 생성 실패"));
  }
};

export const generateUSPStream = async (
  topic: string,
  onChunk: (chunk: string) => void,
  storeName?: string,
  salesService?: string,
  blogCategory?: string,
  blogPlatform?: string,
  suggestedKeywords?: string[]
): Promise<string> => {
  try {
    const ai = getClient();

    const prompt = `
      You are a top-tier Marketing Strategist and Copywriter.
      
      Analyze the following information to derive a powerful **Unique Selling Proposition (USP)** or **Posting Goal** for a blog post.
      The USP should be derived referring to all contents of the keyword discovery stage, including the suggested keywords.

      **INPUT DATA**:
      - Blog Topic: "${topic}"
      ${blogCategory ? `- Blog Category: "${blogCategory}"` : ""}
      ${blogPlatform ? `- Blog Platform: "${blogPlatform}"` : ""}
      ${storeName ? `- Brand/Store Name: "${storeName}"` : ""}
      ${salesService ? `- Sales Service/Product: "${salesService}"` : ""}
      ${suggestedKeywords && suggestedKeywords.length > 0 ? `- Suggested Keywords: ${suggestedKeywords.join(', ')}` : ""}

      **Task**:
      Deduce a powerful **USP (Unique Selling Proposition)** and **Content Strategy** that is highly optimized for the specified Blog Category and Platform. It must maximize the probability of:
      1. **Customer Inquiries** (Lead Generation)
      2. **Brand Trust** (Authority)
      3. **Search Visibility** (SEO/GEO)

      **Output Requirements**:
      - Identify the core pain point of the target audience related to the topic.
      ${storeName || salesService ? '- Explain how this specific brand/service solves it better than others.' : '- If brand/service information is missing, focus on the core value of the topic and the reader\'s needs.'}
      - Use the suggested keywords to refine the USP's focus and relevance.
      - Return ONLY the USP text (1-2 sentences). No labels or explanations.
      - Korean language.
    `;

    const response = await withRetry(() => ai.models.generateContentStream({
      model: TEXT_MODEL,
      contents: prompt,
    }));

    let fullText = '';
    for await (const chunk of response) {
      const text = chunk.text;
      if (text) {
        fullText += text;
        onChunk(text);
      }
    }
    return fullText;
  } catch (error) {
    console.error("Error generating USP stream:", error);
    return "Error generating USP.";
  }
};

export const generateUSP = async (
  topic: string,
  storeName?: string,
  salesService?: string,
  blogCategory?: string,
  blogPlatform?: string,
  suggestedKeywords?: string[]
): Promise<string> => {
  try {
    const ai = getClient();

    const prompt = `
      You are a top-tier Marketing Strategist and Copywriter.
      
      Analyze the following information to derive a powerful **Unique Selling Proposition (USP)** or **Posting Goal** for a blog post.
      The USP should be derived referring to all contents of the keyword discovery stage, including the suggested keywords.

      **INPUT DATA**:
      - Blog Topic: "${topic}"
      ${blogCategory ? `- Blog Category: "${blogCategory}"` : ""}
      ${blogPlatform ? `- Blog Platform: "${blogPlatform}"` : ""}
      ${storeName ? `- Brand/Store Name: "${storeName}"` : ""}
      ${salesService ? `- Sales Service/Product: "${salesService}"` : ""}
      ${suggestedKeywords && suggestedKeywords.length > 0 ? `- Suggested Keywords: ${suggestedKeywords.join(', ')}` : ""}

      **Task**:
      Deduce a powerful **USP (Unique Selling Proposition)** and **Content Strategy** that is highly optimized for the specified Blog Category and Platform. It must maximize the probability of:
      1. **Customer Inquiries** (Lead Generation)
      2. **Sales Conversion** (Purchase)

      **Output Requirements**:
      - Identify the core pain point of the target audience related to the topic.
      ${storeName || salesService ? '- Explain how this specific brand/service solves it better than others.' : '- If brand/service information is missing, focus on the core value of the topic and the reader\'s needs.'}
      - Formulate a specific "Goal of the Post" that acts as a strategic guideline for the writer.
      - **Format**: Just return the strategic paragraph (approx 3-4 lines) that describes the selling point and the goal. Do not use bullet points.
      - **Language**: Korean.
    `;

    const response = await withRetry(() => ai.models.generateContent({
      model: TEXT_MODEL,
      contents: prompt,
      config: {
        temperature: 0.7,
        thinkingConfig: { thinkingLevel: ThinkingLevel.LOW }
      }
    }));

    return response.text || "전략을 도출할 수 없습니다.";
  } catch (error: any) {
    throw new Error(handleApiError(error, "전략 도출 실패"));
  }
};

export const suggestRelatedKeywords = async (
  baseTopic: string, 
  storeName?: string,
  salesService?: string,
  postGoal?: string,
  filePart?: { data: string, mimeType: string },
  referenceNote?: string,
  blogCategory?: string,
  blogPlatform?: string
): Promise<KeywordSuggestion[]> => {
  try {
    const ai = getClient();
    
    const promptText = `
      Topic: "${baseTopic}"
      ${blogCategory ? `Blog Category: "${blogCategory}"` : ""}
      ${blogPlatform ? `Blog Platform: "${blogPlatform}"` : ""}
      ${storeName ? `Store/Brand Name: "${storeName}"` : ""}
      ${salesService ? `Product/Service for Sale: "${salesService}"` : ""}
      ${postGoal ? `**Goal of the Post**: "${postGoal}"` : ""}
      ${referenceNote ? `**Reference Note**: "${referenceNote}"` : ""}

      Based on the topic ${filePart ? "and the provided reference file content" : ""}, 
      suggest 5 high-traffic, low-competition SEO keywords relevant to current trends.
      
      ${storeName || salesService ? `Consider the Store Name and Sales Service provided.` : ""}
      ${postGoal ? `Prioritize keywords that help achieve the goal: "${postGoal}".` : ""}

      For each keyword:
      1. Assign a "Recommendation Rank" (1 to 5).
      2. Calculate an "Algorithm Suitability Score" (0-100) based on current search trends and content potential.
      3. Provide a brief "Reason" why this keyword is good.

      Return ONLY a JSON array of objects.
      Korean language.
    `;

    const parts: Part[] = [{ text: promptText }];
    if (filePart) {
        parts.unshift({ inlineData: filePart });
    }

    const response = await withRetry(() => ai.models.generateContent({
      model: TEXT_MODEL,
      contents: { parts },
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              rank: { type: Type.INTEGER },
              keyword: { type: Type.STRING },
              suitabilityScore: { type: Type.INTEGER },
              reason: { type: Type.STRING }
            }
          }
        }
      }
    }));

    const text = response.text;
    if (!text) return [];
    return JSON.parse(text);
  } catch (error: any) {
    console.error("Failed to suggest keywords", error);
    // 503 에러 등 심각한 오류는 상위로 던집니다.
    if (error.message?.includes("503") || error.message?.includes("overloaded")) {
      throw new Error(handleApiError(error, "키워드 추천 실패"));
    }
    return [];
  }
};

export const generateTitleStream = async (
  keyword: string,
  topic: string,
  onTitlesUpdate: (titles: string[]) => void,
  postGoal?: string,
  referenceNote?: string,
  blogCategory?: string,
  blogPlatform?: string,
  storeName?: string
): Promise<string[]> => {
  try {
    const ai = getClient();
    const prompt = `
      Create ONE high-performing, **GEO (Generative Engine Optimization)** and **SEO (Search Engine Optimization)** ready blog post title.
      
      Context:
      Topic: ${topic}
      ${blogCategory ? `Blog Category: ${blogCategory}` : ""}
      ${blogPlatform ? `Blog Platform: ${blogPlatform}` : ""}
      ${postGoal ? `Goal: ${postGoal}` : ""}
      ${referenceNote ? `Reference Note: ${referenceNote}` : ""}
      ${storeName ? `Store Name: ${storeName}` : ""}
      
      **GEO & SEO GUIDELINES**:
      1. **Keyword & Topic Placement (CRITICAL)**: The blog topic "${topic}" and target keyword "${keyword}" MUST be placed at the very beginning of the title. (e.g., "[Topic] [Keyword] ...")
      2. **Home Feed Strategy**: The title must be emotionally stimulating and highly engaging to attract clicks.
      3. **AI Search Optimization**: Use clear, authoritative phrasing.
      4. **Click-Worthy**: Use powerful words or specific benefits.
      5. **Goal Alignment**: The title should attract readers interested in "${postGoal || topic}".
      6. **Length**: Concise but descriptive (under 40 characters).
      
      Output: Return ONLY the single optimized title. No numbers, no markdown, no explanations.
      Language: Korean.
    `;

    const response = await withRetry(() => ai.models.generateContentStream({
      model: TEXT_MODEL,
      contents: prompt,
    }));

    let fullText = '';
    for await (const chunk of response) {
      const text = chunk.text;
      if (text) {
        fullText += text;
        onTitlesUpdate([fullText.trim()]);
      }
    }
    
    return [fullText.trim()];
  } catch (error) {
    console.error("Error generating titles stream:", error);
    return [];
  }
};

export const generateTitle = async (
  keyword: string,
  topic: string,
  postGoal?: string,
  referenceNote?: string,
  blogCategory?: string,
  blogPlatform?: string,
  storeName?: string
): Promise<string[]> => {
  try {
    const ai = getClient();
    const prompt = `
      Create 3 high-performing, **GEO (Generative Engine Optimization)** and **SEO (Search Engine Optimization)** ready blog post titles.
      
      Context:
      Topic: ${topic}
      ${blogCategory ? `Blog Category: ${blogCategory}` : ""}
      ${blogPlatform ? `Blog Platform: ${blogPlatform}` : ""}
      ${postGoal ? `Goal: ${postGoal}` : ""}
      ${referenceNote ? `Reference Note: ${referenceNote}` : ""}
      ${storeName ? `Store Name: ${storeName}` : ""}
      
      **GEO & SEO GUIDELINES**:
      ${blogCategory === '맛집 리뷰' ? `1. **Keyword & Store Name Placement (CRITICAL)**: The target keyword "${keyword}" MUST be placed at the very beginning of the title, and the store name "${storeName || ''}" MUST be placed at the very end of the title. (e.g., "${keyword} ... ${storeName || ''}")` : `1. **Keyword Placement (CRITICAL)**: The target keyword "${keyword}" MUST be placed at the very beginning of the title. (e.g., "${keyword} ...")`}
      2. **Home Feed Strategy**: The title must be emotionally stimulating and highly engaging to attract clicks and encourage interaction (comments/likes).
      3. **AI Search Optimization**: Use clear, authoritative phrasing that answers a specific user intent directly. Avoid vague metaphors.
      4. **Click-Worthy**: Use powerful words, numbers, or specific benefits to increase CTR.
      5. **Goal Alignment**: The title should attract readers interested in "${postGoal || topic}".
      6. **Length**: Concise but descriptive (under 40 characters if possible).
      
      Output: Return ONLY a valid JSON array of 3 strings. No markdown formatting, no explanations.
      Example: ["Title 1", "Title 2", "Title 3"]
      Language: Korean.
    `;

    const response = await withRetry(() => ai.models.generateContent({
      model: TEXT_MODEL,
      contents: prompt,
      config: {
        temperature: 0.8,
        responseMimeType: "application/json",
      }
    }));
    
    const text = response.text?.trim() || "[]";
    try {
      const titles = JSON.parse(text);
      if (Array.isArray(titles) && titles.length > 0) {
        return titles;
      }
    } catch (e) {
      console.error("Failed to parse titles JSON", e);
    }
    return [`${keyword} 관련 추천 포스팅`];
  } catch (error: any) {
    throw new Error(handleApiError(error, "제목 생성 실패"));
  }
};

export const extractTextFromUrl = async (url: string): Promise<string> => {
  const ai = getClient();
  try {
    let targetUrl = url;
    try {
        if (url.includes('blog.naver.com')) {
            const match = url.match(/blog\.naver\.com\/([a-zA-Z0-9_-]+)\/([0-9]+)/);
            if (match) {
                targetUrl = `https://m.blog.naver.com/${match[1]}/${match[2]}`;
            } else {
                const urlObj = new URL(url);
                const blogId = urlObj.searchParams.get('blogId');
                const logNo = urlObj.searchParams.get('logNo');
                if (blogId && logNo) {
                    targetUrl = `https://m.blog.naver.com/${blogId}/${logNo}`;
                }
            }
        }
    } catch (e) {
        // Ignore URL parsing errors
    }

    let text = '';
    try {
        const response = await withRetry(() => ai.models.generateContent({
          model: "gemini-3.1-pro-preview",
          contents: `Extract the main article text from this URL: ${targetUrl}. 
          
          CRITICAL INSTRUCTION: If you encounter an error like "Unable to extract the article text because the provided website blocks automated access" or if the site blocks bots (like Naver Blog), you MUST use the googleSearch tool to search for the exact URL or the title of the page, and extract the content from the search results or cached snippets. 
          
          Return ONLY the plain text content, without any markdown formatting, headers, or extra conversational text. Do not apologize or explain your method.`,
          config: {
            tools: [{ urlContext: {} }, { googleSearch: {} }]
          }
        }));
        text = response.text || '';
    } catch (e: any) {
        console.warn("Primary extraction failed, trying fallback:", e);
    }
    
    if (text.includes("Unable to extract") || text.includes("blocks automated access") || text.trim() === "") {
        // Fallback if the model still outputs the error message or threw an error
        try {
            const fallbackResponse = await withRetry(() => ai.models.generateContent({
                model: "gemini-3.1-pro-preview",
                contents: `Search for this exact URL using googleSearch: "${targetUrl}". Read the search results and snippets, and reconstruct the main article text as best as you can. Return ONLY the plain text content.`,
                config: {
                    tools: [{ googleSearch: {} }]
                }
            }));
            const fallbackText = fallbackResponse.text || '';
            if (fallbackText.includes("Unable to extract") || fallbackText.includes("blocks automated access")) {
                throw new Error("Blocked");
            }
            return fallbackText;
        } catch (fallbackError: any) {
            console.error("Fallback extraction failed:", fallbackError);
            throw new Error("해당 웹사이트가 보안상의 이유로 내용 추출을 차단하고 있습니다. 원고 내용을 직접 복사하여 붙여넣어 주세요.");
        }
    }
    
    return text;
  } catch (error: any) {
    console.error("URL 추출 실패:", error);
    if (error.message && error.message.includes("보안상의 이유로")) {
        throw error;
    }
    throw new Error(handleApiError(error, "URL 추출 실패"));
  }
};

export const generateOutline = async (
  topic: string,
  storeName?: string,
  salesService?: string,
  postGoal?: string,
  filePart?: { data: string, mimeType: string },
  excludedFilePart?: { data: string, mimeType: string },
  benchmarkingText?: string,
  referenceNote?: string,
  scriptImageParts?: { data: string, mimeType: string }[],
  mustIncludeContent?: string,
  blogCategory?: string,
  blogPlatform?: string,
  servicePriceText?: string,
  servicePriceImageParts?: { data: string, mimeType: string }[],
  blogStyle?: string
): Promise<string> => {
  try {
    const ai = getClient();
    
    let naverDataText = "";
    const searchTarget = storeName || topic;
    if (blogPlatform === '네이버' && searchTarget) {
      const naverData = await fetchNaverLocalData(searchTarget);
      if (naverData) {
        naverDataText = `\n\n**NAVER LOCAL API DATA**: The following is real data fetched from Naver Local API for "${searchTarget}". You MUST use this data (address, phone, etc.) accurately in the outline.\n${naverData}\n`;
      }
    }
    
    const promptText = `
      Create a detailed SEO-optimized blog post outline for the topic: "${topic}".
      ${blogCategory ? `**Blog Category**: "${blogCategory}"` : ""}
      ${blogPlatform ? `**Blog Platform**: "${blogPlatform}"` : ""}
      ${storeName ? `Store/Brand Name: "${storeName}"` : ""}
      ${salesService ? `Product/Service for Sale: "${salesService}"` : ""}
      ${postGoal ? `**Primary Goal**: "${postGoal}"` : ""}
      ${referenceNote ? `**User Reference Note**: "${referenceNote}". Incorporate these specific instructions or details into the outline.` : ""}
      ${mustIncludeContent ? `**MUST INCLUDE CONTENT**: "${mustIncludeContent}". You MUST explicitly include this content or information in the outline.` : ""}
      ${filePart ? "Analyze the attached reference file and incorporate its key points into the structure." : ""}
      ${scriptImageParts && scriptImageParts.length > 0 ? "**VISUAL ANALYSIS**: I have attached 'Script Reference Images'. Analyze these images to understand the atmosphere and context, but do not explicitly describe them in the outline." : ""}
      ${excludedFilePart ? "**CRITICAL CONSTRAINT**: The attached 'EXCLUDED FILE' contains information that MUST NOT appear in the outline. Do not mention or reference its specific contents." : ""}
      ${servicePriceText ? `**SERVICE PRICE INFO**: The user provided the following pricing information: "${servicePriceText}". You MUST plan to include a Markdown table in the body detailing these services and prices.` : ""}
      ${servicePriceImageParts && servicePriceImageParts.length > 0 ? `**SERVICE PRICE IMAGE**: Price table images are attached. You MUST plan to extract and include the relevant prices in a Markdown table in the body.` : ""}
      ${blogCategory === '맛집 리뷰' && !servicePriceText && (!servicePriceImageParts || servicePriceImageParts.length === 0) ? `**PRICING CONSTRAINT**: Since this is a Restaurant Review and no specific price information was provided, DO NOT invent or include any prices in the outline or table.` : ""}
      ${naverDataText}
      
      **UNIVERSAL BLOG STYLE GUIDELINES (MUST FOLLOW FOR ALL TOPICS)**:
      1. **Topic Focus (C-Rank)**: Concentrate deeply on one main topic (or two closely related ones). Establish clear expertise in the category.
      2. **Experience-Based Content**: Structure the outline to reflect a first-hand, authentic experience with honest opinions. Avoid sounding like a generic AI.
      3. **Intro Strategy**: The introduction MUST be SEO-optimized and feature a powerful 'Hook' based on the Topic ("${topic}") and USP ("${postGoal || 'the main benefit'}"). ${blogCategory === '맛집 리뷰' ? "Maintain an authentic, experiential tone from a visitor's perspective." : "Start with an SEO-optimized Hook that addresses the reader's core curiosity and provides a compelling reason to keep reading, using specific data or intriguing facts to build trust."}
      4. **Curiosity Resolution**: Do not give everything away immediately after the intro. Resolve the reader's curiosity step-by-step throughout the body.
      5. **Readability & Formatting**: **CRITICAL**: You MUST group exactly 2 lines/sentences together, and then insert an empty line (double Enter) to create a new paragraph. This 2-line paragraph rule is absolute for all content to ensure maximum readability.
      6. **Structure**: Use at least 3 subheadings. **CRITICAL**: You MUST format ALL subheadings as blockquotes using the \`>\` symbol (e.g., \`> ## Subheading\`).
      7. **Visual & Rich Media**: Actively incorporate markdown tables to increase reader dwell time. DO NOT use any bracket placeholders like "[ ]" (e.g., do not write "[이미지 삽입]"). The text must be clean and ready to copy-paste.
      8. **Keyword Placement**: The target keyword MUST be placed at the very beginning of the title.
      9. **Year Reference**: If you mention the current year or any recent year, strictly use the current year (e.g., 2026년). Do not use 2024 or 2025.
      10. **Contact Phrasing**: DO NOT use the phrase "카카오톡 상담" (KakaoTalk Consultation). Instead, always use the word "문의" (Inquiry).

      ${benchmarkingText ? `
      **BENCHMARKING MASTER INSTRUCTION**: 
      I have provided "BENCHMARKING TEXT" below. This text is a reference that the user wants to copy.
      You MUST modify and adapt this benchmarking text to perfectly fit the selected Blog Category (${blogCategory || 'General'}), Topic (${topic}), Brand/Store Name (${storeName || 'our brand'}), Product/Service (${salesService || 'our service'}), and USP (${postGoal || 'our USP'}).
      1. **Analyze Structure**: Identify its logical flow and tone.
      2. **Adapt Content**: Create an outline that uses the benchmark's flow as a reference, but completely changes the subject matter to promote our specific brand, product, and USP.
      ` : ""}
      
      ${blogCategory === '맛집 리뷰' ? `
      **CRITICAL STRUCTURE REQUIREMENT FOR RESTAURANT REVIEW**:
      Since the category is "맛집 리뷰" (Restaurant Review), you MUST 100% include the following 6 mandatory sections/information in the outline without fail:
      1. 🏪 업체명 (Store name)
      2. 📍 주소 (Address) - You MUST research the actual address.
      3. ⏰ 영업시간 (Business hours) - You MUST use the Google Search tool to deeply research the latest, most accurate business hours for "${storeName || topic}".
      4. 🚗 주차 여부 (Parking availability)
      5. 🚶 오시는 길 (Directions)
      6. ✨ 인테리어 및 분위기 (Interior and atmosphere)
      
      Additionally, include:
      - 주문메뉴, 맛 평가 (Ordered menu, taste evaluation) - Include prices ONLY if provided via Service Price Text or Image.
      - 사장님 직원등 친절도 (Kindness of owner/staff)
      
      **EMOJI REQUIREMENT**: You MUST prefix the specific sections with the exact emojis shown above (e.g., 🏪 업체명, 📍 주소, ⏰ 영업시간, 🚗 주차 여부, 🚶 오시는 길, ✨ 인테리어 및 분위기).
      
      (Optional but recommended: 전화번호, 이벤트, 특징, 총평)
      
      **PERSPECTIVE**: The outline must be structured from the first-person perspective of a customer who actually visited the restaurant (experiential tone).
      
      ${blogPlatform === '네이버' ? `**NAVER SMARTPLACE INTEGRATION (MANDATORY)**: Since the platform is '네이버', you MUST use the provided NAVER LOCAL API DATA and the Google Search tool to find the "네이버 스마트플레이스" (Naver Map/Place) information for "${storeName || topic}". You MUST extract real data (address, hours, menu items, prices, parking, features) and explicitly incorporate this real data into the outline.` : ""}
      ` : `
      **CRITICAL RESTRICTION**:
      Since the category is NOT "맛집 리뷰" (Restaurant Review), you MUST NOT include any physical addresses (주소) or URLs/links (링크) in the generated outline. Do not write about locations or website links.
      `}
      ${naverDataText}
      
      ${blogStyle === '현장 밀착형 스토리텔링 (현장감, 신뢰, 파트너십)' ? `
      **[현장 밀착형 스토리텔링 스타일 가이드]**
      1. **현장감 (Realness)**: 스튜디오 사진이 아닌, 실제 작업 현장의 '가공되지 않은' 사진을 활용해 투명성을 강조합니다.
      2. **신뢰 자본 축적**: "내부용 지게차만 사용한다", "라벨링을 철저히 한다" 등 디테일한 원칙을 언급하며 '보이지 않는 곳에서도 정직하다'는 인상을 줍니다.
      3. **관계 지향적 어조**: 독자를 '사장님'이라 부르며, 단순한 판매자가 아니라 함께 성장하는 '파트너'로서의 유대감을 형성합니다.
      4. **구조적 연결**: 지난번 포스팅을 언급하며 이야기를 이어가는 '연재물' 형식을 취해 블로그의 체류 시간을 높입니다.
      5. **사진 활용**: 완벽하게 세팅된 사진보다는 조금 투박하더라도 현장의 디테일(작업 중인 손, 온도계 수치 등)이 담긴 사진을 활용합니다.
      6. **과정 중심**: "우리는 신선합니다" 대신 "왜 신선할 수밖에 없는지" 그 과정을 설명하세요.
      7. **구체적 데이터**: '여러 지역' 대신 '부산/대구/울산' 등 구체적인 명칭을 사용하세요.
      8. **독자 이익 마무리**: [우리의 노력] → [사장님이 얻는 가치] → [감사 인사 및 문의 유도] 공식으로 마무리하세요.
      
      **[구조 지침]**
      - 도입: 지난 이야기 언급 또는 오늘 현장에 나가게 된 계기
      - 전개 1: 전체적인 현장 모습 (입구, 창고 전경 등)
      - 전개 2: 우리의 디테일 한 가지 (청결, 정리 정돈, 검수 과정 등)
      - 강점: 왜 이렇게 까다롭게 하는지 우리만의 철학 한 줄
      - 정보: 활동 범위 및 취급 품목 언급
      ` : (blogStyle ? `**CRITICAL TONE & STYLE REQUIREMENT**: The user has explicitly selected the following blog style: "${blogStyle}". You MUST structure the outline and write the content to perfectly match this specific style and tone. Do not use a generic tone.` : "")}

      Structure Guidelines:
      1. **Introduction**: MUST include a "Hook" strategy to grab attention immediately. Address the reader's problem related to "${postGoal || topic}". **CRITICAL**: The introduction MUST be highly SEO-optimized with a topic-based hook that captures the reader's interest.
      2. **Body (H2/H3)**: Structured logic to persuade or inform the reader. 
         - **IMPORTANT**: Designate one section to be presented as a **Table/Chart** (e.g., Feature comparison, Price list, Pros/Cons, Specs).
      3. **Conclusion**: MUST be conversion-focused. Summarize and lead the reader to the specific goal ("${postGoal || 'Action'}"). **CRITICAL**: Do NOT include the word "결론" (Conclusion) as a heading or text. Start the conclusion naturally.
      
      Output Format:
      1. Introduction (Hook, Problem, Solution)
      2. Key Headings (Format as blockquotes: > ## Heading)
      3. Sub-points (Format as blockquotes: > ### Sub-point)
      4. Conclusion (Summary, Persuasive Call to Action - NO "Conclusion" label)
      
      Add notes on which keywords to target in each section.
      Korean language only.
    `;

    const parts: Part[] = [{ text: promptText }];
    
    // Add Script Reference Images
    if (scriptImageParts && scriptImageParts.length > 0) {
        scriptImageParts.forEach(img => {
            parts.push({ inlineData: img });
        });
        parts.push({ text: "These are the Script Reference Images. Analyze them for context." });
    }

    if (servicePriceImageParts && servicePriceImageParts.length > 0) {
        servicePriceImageParts.forEach(img => {
            parts.push({ inlineData: img });
        });
        parts.push({ text: "These are the Service Price Table Images. Extract the relevant prices to use in the outline." });
    }

    if (filePart) {
        parts.unshift({ inlineData: filePart });
    }
    
    if (benchmarkingText) {
        // Pass benchmarking content as text part
        parts.push({ text: `[[BENCHMARKING TEXT START]]\n${benchmarkingText}\n[[BENCHMARKING TEXT END]]\n\nUse the structure of the text above as a template.` });
    }

    if (excludedFilePart) {
        parts.push({ inlineData: excludedFilePart });
        parts.push({ text: "This previous file is the EXCLUDED FILE. Its contents are forbidden." });
    }

    const response = await withRetry(() => ai.models.generateContent({
      model: TEXT_MODEL,
      contents: { parts },
      config: {
        temperature: 0.7,
        thinkingConfig: { thinkingLevel: ThinkingLevel.LOW },
        tools: [{ googleSearch: {} }]
      }
    }));

    return response.text || "개요를 생성할 수 없습니다.";
  } catch (error: any) {
    throw new Error(handleApiError(error, "개요 생성 실패"));
  }
};

export const generateFullPostStream = async (
  topic: string, 
  outline: string,
  storeName: string | undefined,
  salesService: string | undefined,
  postGoal: string | undefined,
  onChunk: (text: string) => void,
  onReset?: () => void,
  excludedFilePart?: { data: string, mimeType: string },
  benchmarkingText?: string,
  referenceNote?: string,
  scriptImageParts?: { data: string, mimeType: string }[],
  mustIncludeContent?: string,
  blogCategory?: string,
  blogPlatform?: string,
  servicePriceText?: string,
  servicePriceImageParts?: { data: string, mimeType: string }[],
  blogStyle?: string
): Promise<void> => {
  try {
    const ai = getClient();

    let naverDataText = "";
    const searchTarget = storeName || topic;
    if (blogPlatform === '네이버' && searchTarget) {
      const naverData = await fetchNaverLocalData(searchTarget);
      if (naverData) {
        naverDataText = `\n\n**NAVER LOCAL API DATA**: The following is real data fetched from Naver Local API for "${searchTarget}". You MUST use this data (address, phone, etc.) accurately in the blog post.\n${naverData}\n`;
      }
    }

    const prompt = `
      Write a comprehensive, engaging, and **GEO (Generative Engine Optimization)** and **SEO (Search Engine Optimization)** ready blog post based on the following topic and outline.
      
      Topic: ${topic}
      ${blogCategory ? `Blog Category: "${blogCategory}"` : ""}
      ${blogPlatform ? `Blog Platform: "${blogPlatform}"` : ""}
      ${storeName ? `Store/Brand Name: "${storeName}"` : ""}
      ${salesService ? `Product/Service for Sale: "${salesService}"` : ""}
      ${postGoal ? `**ULTIMATE GOAL**: The content must achieve this goal: "${postGoal}"` : ""}
      ${referenceNote ? `**USER REFERENCE NOTE**: "${referenceNote}". This is a specific instruction from the user. You MUST reflect this note in the content.` : ""}
      ${mustIncludeContent ? `**MUST INCLUDE CONTENT**: "${mustIncludeContent}". You MUST explicitly include this exact content or information naturally within the blog post.` : ""}
      ${servicePriceText ? `**SERVICE PRICE INFO**: The user provided the following pricing information: "${servicePriceText}". You MUST include a Markdown table in the body detailing these services and prices.` : ""}
      ${servicePriceImageParts && servicePriceImageParts.length > 0 ? `**SERVICE PRICE IMAGE**: Price table images are attached. You MUST extract and include the relevant prices in a Markdown table in the body.` : ""}
      ${blogCategory === '맛집 리뷰' && !servicePriceText && (!servicePriceImageParts || servicePriceImageParts.length === 0) ? `**PRICING CONSTRAINT**: Since this is a Restaurant Review and no specific price information was provided, DO NOT invent or include any prices in the text or table.` : ""}
      ${naverDataText}
      
      **UNIVERSAL BLOG STYLE GUIDELINES (MUST FOLLOW FOR ALL TOPICS)**:
      1. **Topic Focus (C-Rank)**: Concentrate deeply on one main topic (or two closely related ones). Establish clear expertise in the category.
      2. **Experience-Based Content**: Write as if sharing a first-hand, authentic experience with honest opinions. This is the most powerful content type. Avoid sounding like a generic AI.
      3. **Intro Strategy**: The introduction MUST be SEO-optimized and feature a powerful 'Hook' based on the Topic ("${topic}") and USP ("${postGoal || 'the main benefit'}"). ${blogCategory === '맛집 리뷰' ? "Maintain an authentic, experiential tone from a visitor's perspective." : "Start with an SEO-optimized Hook that addresses the reader's core curiosity and provides a compelling reason to keep reading, using specific data or intriguing facts to build trust and increase the chance of being cited by AI."}
      4. **Curiosity Resolution (Prompt Design)**: Do not give everything away immediately after the intro. Resolve the reader's curiosity step-by-step throughout the body.
      5. **Readability & Formatting**: **CRITICAL**: You MUST group exactly 2 lines/sentences together, and then insert an empty line (double Enter) to create a new paragraph. This 2-line paragraph rule is absolute for all content to ensure maximum readability.
      6. **Structure**: Use at least 3 subheadings. **CRITICAL**: You MUST format ALL subheadings as blockquotes using the \`>\` symbol (e.g., \`> ## Subheading\`).
      7. **Visual & Rich Media**: Do not just list text. Actively incorporate markdown tables to increase reader dwell time. DO NOT use any bracket placeholders like "[ ]" (e.g., do not write "[이미지 삽입]"). The text must be clean and ready to copy-paste.
      8. **Keyword Placement**: The target keyword MUST be placed at the very beginning of the title.
      9. **Year Reference**: If you mention the current year or any recent year, strictly use the current year (e.g., 2026년). Do not use 2024 or 2025.
      10. **Hashtags**: At the very end of the post, provide exactly 5 highly relevant hashtags. Separate them from the main content with the marker "[HASHTAGS]". Format them as a single line of space-separated hashtags starting with #.
      11. **Contact Phrasing**: DO NOT use the phrase "카카오톡 상담" (KakaoTalk Consultation). Instead, always use the word "문의" (Inquiry).

      ${benchmarkingText ? `
      **BENCHMARKING & ADAPTATION MODE ACTIVATED**:
      I have provided "BENCHMARKING TEXT". This text is a reference that the user wants to copy.
      You MUST modify and adapt this benchmarking text to perfectly fit the selected Blog Category (${blogCategory || 'General'}), Topic (${topic}), Brand/Store Name (${storeName || 'our brand'}), Product/Service (${salesService || 'our service'}), and USP (${postGoal || 'our USP'}).
      
      **YOUR MISSION**:
      1. **Analyze the DNA**: Absorb the benchmark's **tone**, **sentence length rhythm**, and **narrative structure**.
      2. **Adapt & Rewrite**: Use the benchmark as a reference, but rewrite the content to focus entirely on our Topic, Brand, Service, and USP.
      3. **Brand Adaptation**: Replace the benchmark's brand/service with "${storeName || 'our brand'}" and "${salesService || 'our service'}". The hero of this story is now "${storeName}".
      4. **Simulated Document Avoidance**: You must write a completely new article to avoid "Similar Document" penalties by search engines. 
         - **Structure Mimicry**: Copy the *flow* and *logic*, but NOT the *phrasing*.
         - **Sentence Transformation**: Invert sentence structures, use different vocabulary, and change the tone slightly if needed.
      ` : ""}

      ${blogCategory === '맛집 리뷰' ? `
      **CRITICAL STRUCTURE REQUIREMENT FOR RESTAURANT REVIEW**:
      Since the category is "맛집 리뷰" (Restaurant Review), you MUST 100% ensure the following mandatory sections/information are clearly written and included in the final post without fail:
      1. 🏪 업체명 (Store name)
      2. 📍 주소 (Address) - You MUST research and include the actual address.
      3. ⏰ 영업시간 (Business hours) - You MUST use the Google Search tool to deeply research the latest, most accurate business hours for "${storeName || topic}" and write them accurately.
      4. 🚗 주차 여부 (Parking availability)
      5. 🚶 오시는 길 (Directions)
      6. ✨ 인테리어 및 분위기 (Interior and atmosphere)
      
      Additionally, include:
      - 주문메뉴, 맛 평가 (Ordered menu, taste evaluation) - Include prices ONLY if provided via Service Price Text or Image.
      - 사장님 직원등 친절도 (Kindness of owner/staff)
      
      **EMOJI REQUIREMENT**: You MUST prefix the specific sections with the exact emojis shown above (e.g., 🏪 업체명, 📍 주소, ⏰ 영업시간, 🚗 주차 여부, 🚶 오시는 길, ✨ 인테리어 및 분위기) in the body text.
      
      (Optional but recommended: 전화번호, 이벤트, 특징, 총평)
      
      **PERSPECTIVE & TONE**: You MUST write from the first-person perspective of a customer who actually visited the restaurant. Use an authentic, experiential tone (e.g., "I visited...", "The taste was...").
      Make sure these points are naturally integrated into the blog post flow.

      **RESTAURANT REVIEW ENTITY & LINE RULES**:
      1. **Entity Reference**: NEVER use the generic word '이것' (this) to refer to the restaurant or its products. ALWAYS use the actual Store/Brand Name ("${storeName || topic}") instead.
      2. **Strict Line Length**: EVERY single line in the blog post body MUST be 20 characters or less. You MUST manually insert a newline (\n) to ensure no line exceeds 20 characters. This is a hard constraint for readability on specific mobile layouts.
      3. **Content Length**: The total length of the blog post (excluding hashtags) MUST be between 1500 and 2500 characters. You MUST provide enough detail and descriptive content to reach this length.
      
      ${blogPlatform === '네이버' ? `**NAVER SMARTPLACE INTEGRATION (MANDATORY)**: Since the platform is '네이버', you MUST use the provided NAVER LOCAL API DATA and the Google Search tool to find the "네이버 스마트플레이스" (Naver Map/Place) information for "${storeName || topic}". You MUST extract real data (address, hours, menu items, prices, parking, features) and write the review based entirely on this real data. Do not invent menu items or hours; use the actual data.` : ""}
      ` : `
      **CRITICAL RESTRICTION**:
      Since the category is NOT "맛집 리뷰" (Restaurant Review), you MUST NOT include any physical addresses (주소) or URLs/links (링크) in the generated post. Do not write about locations or website links.
      `}
      ${naverDataText}

      ${blogStyle === '현장 밀착형 스토리텔링 (현장감, 신뢰, 파트너십)' ? `
      **[현장 밀착형 스토리텔링 스타일 가이드]**
      1. **현장감 (Realness)**: 스튜디오 사진이 아닌, 실제 작업 현장의 '가공되지 않은' 사진을 활용해 투명성을 강조합니다.
      2. **신뢰 자본 축적**: "내부용 지게차만 사용한다", "라벨링을 철저히 한다" 등 디테일한 원칙을 언급하며 '보이지 않는 곳에서도 정직하다'는 인상을 줍니다.
      3. **관계 지향적 어조**: 독자를 '사장님'이라 부르며, 단순한 판매자가 아니라 함께 성장하는 '파트너'로서의 유대감을 형성합니다.
      4. **구조적 연결**: 지난번 포스팅을 언급하며 이야기를 이어가는 '연재물' 형식을 취해 블로그의 체류 시간을 높입니다.
      5. **사진 활용**: 완벽하게 세팅된 사진보다는 조금 투박하더라도 현장의 디테일(작업 중인 손, 온도계 수치 등)이 담긴 사진을 활용합니다.
      6. **과정 중심**: "우리는 신선합니다" 대신 "왜 신선할 수밖에 없는지" 그 과정을 설명하세요.
      7. **구체적 데이터**: '여러 지역' 대신 '부산/대구/울산' 등 구체적인 명칭을 사용하세요.
      8. **독자 이익 마무리**: [우리의 노력] → [사장님이 얻는 가치] → [감사 인사 및 문의 유도] 공식으로 마무리하세요.
      
      **[구조 지침]**
      - 도입: 지난 이야기 언급 또는 오늘 현장에 나가게 된 계기
      - 전개 1: 전체적인 현장 모습 (입구, 창고 전경 등)
      - 전개 2: 우리의 디테일 한 가지 (청결, 정리 정돈, 검수 과정 등)
      - 강점: 왜 이렇게 까다롭게 하는지 우리만의 철학 한 줄
      - 정보: 활동 범위 및 취급 품목 언급

      **[톤앤매너 및 포맷팅 지침]**
      - **말투**: 구어체와 문어체를 적절히 섞어 친근하고 신뢰감 있는 말투를 사용하세요.
      - **포맷팅 (필수)**: 
        - 모든 본문 텍스트는 **가운데 정렬**되어야 합니다.
        - **한 줄에 최대 10자(한글 기준)**까지만 입력하고, 그 이후에는 반드시 줄바꿈을 하세요.
      ` : (blogStyle ? `**CRITICAL TONE & STYLE REQUIREMENT**: The user has explicitly selected the following blog style: "${blogStyle}". You MUST write the entire post to perfectly match this specific style and tone. Do not use a generic tone.` : "")}

      Outline:
      ${outline}
      
      **GEO (GENERATIVE ENGINE OPTIMIZATION) GUIDELINES**:
      1. **Authority & Depth**: Write with high authority. Use specific numbers, statistics, and professional terminology.
      2. **Direct Answers**: Start sections with direct answers to the user's potential questions to capture snippets (Featured Snippets).
      3. **Structured Data**: Use lists, bullet points, and tables frequently.
      4. **Entity Richness**: Mention specific brands, locations, tools, or concepts related to the topic to help AI understand the context.

      **VISUAL & FORMATTING RULES (CRITICAL - FOLLOW EXACTLY)**:
      Use the following Markdown syntax to apply specific colors and styles requested by the user:
      
      1. **Important Keyword (RED Text)**: Wrap the keyword in **double asterisks** like this: **ImportantKeyword**.
      2. **Important Sentence (RED Text on YELLOW Background)**: Wrap the sentence in **triple asterisks** like this: ***This is a critical sentence.***
      3. **Emphasized Keyword (BLUE Text)**: Wrap the keyword in **single asterisks** like this: *EmphasizedKeyword*.
      4. **Emphasized Sentence (BLUE Text on YELLOW Background)**: Wrap the sentence in **backticks** like this: \`This is an emphasized sentence.\`
      5. **Subheadings**: Subheadings MUST be formatted as blockquotes using the \`>\` symbol (e.g., \`> ## Subheading\`). DO NOT apply any colors to subheadings; they must remain default black.

      **READABILITY (Spacing - CRITICAL)**: 
      - **Paragraph Structure**: **STRICTLY** end a paragraph after **every 2 sentences**.
      - **Spacing**: Insert a double line break (\\n\\n) after every 2 sentences to create whitespace. This is essential for readability and ensures that when the content is copied, it maintains a clear structure with a blank line between every 두 sentences.
      - **NO IMAGE DESCRIPTIONS**: Do NOT write text describing the reference images (e.g. "Image 1 shows..."). The text should focus solely on the topic information.
      - **NO KEYWORD LISTS**: Do NOT output a list of "Target Keywords" or "Keywords". The keywords must be naturally integrated into the flow of the text. Do NOT print the outline notes about keywords.
      
      - **DO NOT** write the Main Title (H1) at the start.
      - Korean language only.
      - **Terminology**: Use '여러분' (Everyone) instead of '당신' (You).
      - **Conclusion Formatting**: Do NOT include the word "결론" (Conclusion) as a heading or text in the final section. Start the conclusion naturally without a "Conclusion" label.
    `;

    const parts: Part[] = [{ text: prompt }];

    // Add Script Reference Images
    if (scriptImageParts && scriptImageParts.length > 0) {
        scriptImageParts.forEach(img => {
            parts.push({ inlineData: img });
        });
        parts.push({ text: "These are the Script Reference Images. Use them for context/atmosphere ONLY. Do NOT describe them in the text." });
    }

    if (servicePriceImageParts && servicePriceImageParts.length > 0) {
        servicePriceImageParts.forEach(img => {
            parts.push({ inlineData: img });
        });
        parts.push({ text: "These are the Service Price Table Images. Extract the relevant prices to use in the text and table." });
    }

    if (benchmarkingText) {
        parts.push({ text: `[[BENCHMARKING TEXT START]]\n${benchmarkingText}\n[[BENCHMARKING TEXT END]]` });
    }

    if (excludedFilePart) {
        parts.push({ inlineData: excludedFilePart });
        parts.push({ text: "This file content above is FORBIDDEN. Do not use it." });
    }

    await withRetry(async () => {
      if (onReset) onReset();
      
      const streamResult = await ai.models.generateContentStream({
        model: TEXT_MODEL,
        contents: { parts },
        config: {
          temperature: 0.7,
          thinkingConfig: { thinkingLevel: ThinkingLevel.LOW },
          tools: [{ googleSearch: {} }]
        }
      });

      for await (const chunk of streamResult) {
        if (chunk.text) {
          onChunk(chunk.text);
        }
      }
    });
  } catch (error: any) {
    throw new Error(handleApiError(error, "본문 생성 실패"));
  }
};

export interface ImagePromptRequest {
  context: string;
  prompt: string;
}

export const generateImagePromptsForPost = async (
  content: string, 
  hasFaceReference: boolean = false, 
  numberOfImages: number = 4, 
  hasReferenceImages: boolean = false, 
  modelName: string = 'gemini-3.1-flash-image-preview',
  style: string = '기본 스타일'
): Promise<ImagePromptRequest[]> => {
  try {
    const ai = getClient();
    const isAuto = numberOfImages === 0;
    const supportsText = modelName === 'gemini-3.1-flash-image-preview';

    const styleInstruction = style === '기본 스타일' 
      ? '"Modern Professional Infographic" with a clean, high-end aesthetic. Theme: Choose ONE consistent theme: "Professional Flat Design (Vector Art)" OR "Sophisticated 3D Isometric".'
      : `Apply the following specific visual style: "${style}". Ensure all images in the set maintain this consistent style.`;

    const textRules = supportsText ? `
    **STRICT TEXT RULES (KOREAN ONLY - CRITICAL)**:
    1. **Line Count**: **MUST include AT LEAST 2 LINES of attractive Korean text**.
    2. **Structure**:
       - **Line 1 (Headline)**: Impactful, Bold Sans-serif font.
       - **Line 2 (Subtitle)**: Descriptive, smaller.
    3. **Legibility & Accuracy**: Text must be perfectly legible and aesthetically pleasing. **ABSOLUTELY NO KOREAN TEXT CORRUPTION (깨짐)**. To prevent corruption, **KEEP TEXT EXTREMELY SHORT (1-3 words per line)**. Summarize long concepts into punchy, short phrases.
    4. **NO ENGLISH**: **DO NOT include any English text** in the image. This is a strict requirement.
    5. **Privacy**: Do not include contact info unless explicitly present in content.
    6. **NO PLACEHOLDERS**: **ABSOLUTELY FORBIDDEN** to include placeholder text like "<IMAGE>", "IMAGE 1", "[IMAGE]", or any file names in the image. Only include the specified Korean headline and subtitle.

    **Prompt Format (English)**:
    - Detailed visual description.
    - **CRITICAL INSTRUCTION**: Explicitly write: "Render the Korean text '[Line 1 Text]' in a massive, bold Sans-serif font. Directly below it, render '[Line 2 Text]' in a clean font. Text must be perfectly spelled in Korean Hangul."
    ` : `
    **STRICT TEXT RULES**:
    - **NO TEXT ALLOWED**: The selected image generation model does NOT support text generation. **DO NOT** include any instructions to render text, typography, labels, or words in the image.
    - **Prompt Format (English)**: Detailed visual description ONLY. Focus purely on the visual elements, composition, and style.
    `;

    const prompt = `
      Analyze the blog post content to ${isAuto ? "extract a variable number of (between 4 and 8)" : `extract ${numberOfImages}`} key visual concepts.
    Create ${isAuto ? "a set of" : numberOfImages} high-quality image generation prompts according to the following structure.
    
    ${hasFaceReference ? "**IMPORTANT**: The user has provided a specific PERSON REFERENCE photo. Therefore, EVERY image prompt (or at least the majority) MUST explicitly describe a 'main character' or 'person' (who matches the reference) acting as the presenter or experiencing the scenario. The person MUST be included without any distortion or modification." : ""}
    ${hasReferenceImages ? "**INFOGRAPHIC MODE (MANDATORY)**: The user has provided reference images. You MUST use these images 100% as they are, without any distortion or caricature. Your prompts MUST focus on creating 'Attractive Data-Driven Infographics' where these reference images are the central, non-distorted visual elements. Design layouts like comparison tables, step-by-step guides, or feature highlights that showcase the reference images perfectly." : ""}

    **CONTENT STRUCTURE**:
    - **Image 1 (Hook)**: Visualizes the problem or a shocking fact to grab attention.
    - **Middle Images**: Visualize key concepts, steps, solutions, or benefits in a logical narrative flow.
    - **Last Image (Action/Conclusion)**: Summarizes and encourages action.

    **VISUAL DESIGN STYLE**:
    - **Style**: ${styleInstruction}
    - **Quality**: Clean, no AI distortion, no excessive glaze.
    - **Layout**: Mobile-optimized, central or Z-pattern. Use clear visual hierarchy.
    - **Constraint**: DO NOT put image numbers on the image.
    ${textRules}

    Return JSON array of ${isAuto ? "objects (length between 4 and 8, determined by content length)" : `${numberOfImages} objects`}:
    - 'context': Korean description.
    - 'prompt': The English prompt for the model.

    Content snippet: ${content.substring(0, 4000)}...
  `;

  const response = await withRetry(() => ai.models.generateContent({
    model: TEXT_MODEL,
    contents: prompt,
    config: {
      temperature: 0.7,
      thinkingConfig: { thinkingLevel: ThinkingLevel.LOW },
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.ARRAY,
        items: {
            type: Type.OBJECT,
            properties: {
                context: { type: Type.STRING },
                prompt: { type: Type.STRING }
            }
        }
      }
    }
  }));

    try {
      return JSON.parse(response.text || "[]");
    } catch (e) {
      return [];
    }
  } catch (error: any) {
    throw new Error(handleApiError(error, "이미지 프롬프트 생성 실패"));
  }
};

export const generateThumbnailPrompt = async (
  keyword: string, 
  content: string, 
  modelName: string = 'gemini-3.1-flash-image-preview',
  style: string = '기본 스타일'
): Promise<string> => {
  try {
    const ai = getClient();
    const supportsText = modelName === 'gemini-3.1-flash-image-preview';
    
    const styleInstruction = style === '기본 스타일'
      ? '"Viral YouTube Thumbnail", "Netflix Poster", "High-End Brand Identity".'
      : `Apply the following specific visual style: "${style}".`;

    const textRequirements = supportsText ? `
      **TEXT REQUIREMENTS (CRITICAL)**:
      - **Language**: Korean Only. **NO ENGLISH TEXT ALLOWED**.
      - **Main Text**: The blog topic or keyword "${keyword}" MUST be the prominent, central text in the image.
      - **Positioning**: The text MUST be **perfectly centered** in the image.
      - **Font**: You MUST use the **Pretendard** font for all Korean text.
      - **Formatting**: The text MUST be limited to a MAXIMUM of 3 lines.
      - **Visual Prominence**: The text MUST be visually striking, large, and the absolute focal point of the image. Use high-contrast colors and bold typography.
      - **Subtitle**: Add a short, catchy subtitle below the main text (e.g., "필독 가이드", "최신 정보").
      - **Accuracy**: **ABSOLUTELY NO KOREAN TEXT CORRUPTION (깨짐)**. To prevent corruption, **KEEP ALL TEXT EXTREMELY SHORT (1-3 words per line)**.
      - **Style**: 3D Glossy Text, Neon Light, or Bold Typography with heavy drop shadows.
      - **NO PLACEHOLDERS**: **ABSOLUTELY FORBIDDEN** to include placeholder text like "<IMAGE>", "IMAGE 1", or any image labels.
      
      The output prompt must be in English.
      Example: "A cinematic 3D render of [Subject]. Center stage: The Korean text '${keyword}' in massive, glowing gold characters using the Pretendard font, perfectly centered, split into 2-3 lines for maximum impact. Below it, a smaller white Korean text reading '[Subtitle]' adds context. Background is a deep, rich gradient with floating particles."
    ` : `
      **TEXT REQUIREMENTS**:
      - **NO TEXT ALLOWED**: The selected image generation model does NOT support text generation. **DO NOT** include any instructions to render text, typography, labels, or words in the image.
      
      The output prompt must be in English.
      Example: "A cinematic 3D render of [Subject]. Center stage: A glowing golden icon representing the topic. Background is a deep, rich gradient with floating particles."
    `;

    const prompt = `
      Create a prompt for a **World-Class Blog Thumbnail** (1:1 ratio).
      
      **DESIGN VISION**:
      - **Vibe**: ${styleInstruction}
      - **Composition**: Central focus, dynamic background, depth of field.
      
      ${textRequirements}
      
      Content context: ${content.substring(0, 800)}...
    `;
    
    const response = await withRetry(() => ai.models.generateContent({
      model: TEXT_MODEL,
      contents: prompt,
    }));
    return response.text || `A creative 3D design representing the blog topic. No text.`;
  } catch (error: any) {
    throw new Error(handleApiError(error, "썸네일 프롬프트 생성 실패"));
  }
};

export const generateBlogImage = async (
  prompt: string, 
  aspectRatio: string = "16:9",
  referenceImages: { data: string, mimeType: string }[] = [],
  faceImageParts: { data: string, mimeType: string }[] = [],
  modelName: string = 'gemini-3.1-flash-image-preview'
): Promise<string | null> => {
  const ai = getClient();
  try {
    if (modelName.startsWith('imagen-')) {
        const response = await withRetry(() => ai.models.generateImages({
            model: modelName,
            prompt: prompt,
            config: {
              numberOfImages: 1,
              outputMimeType: 'image/jpeg',
              aspectRatio: aspectRatio as any,
            },
        }));
        const base64EncodeString: string = response.generatedImages[0].image.imageBytes;
        return `data:image/jpeg;base64,${base64EncodeString}`;
    } else {
        const parts: Part[] = [];

        // 1. Handle Person Consistency FIRST (Critical Priority)
        if (faceImageParts && faceImageParts.length > 0) {
          faceImageParts.forEach(img => parts.push({ inlineData: img }));
          parts.push({ text: "REFERENCE ID: PERSON_IMAGE. The image(s) above are the Reference Person(s). You must generate an image where these exact people are included without any distortion or modification. \n\n**CRITICAL REQUIREMENT**:\n1. **Zero Distortion**: The person(s) must be 100% identical to the reference. Do not deform, caricature, or alter the person in any way. \n2. **Integration**: Incorporate the person(s) naturally into the scene while keeping their appearance completely unmodified." });
        }
        
        // 2. Handle other reference images (Logo, Context)
        if (referenceImages && referenceImages.length > 0) {
          referenceImages.forEach(img => {
              parts.push({ inlineData: img });
          });
          // Append instruction to use the images without distortion
          parts.push({ 
            text: "REFERENCE ID: SOURCE_IMAGES. The images above are the Reference Images. You MUST use them 100% as provided. \n\n**STRICT REQUIREMENTS**:\n1. **Zero Distortion**: Do not deform, caricature, or alter the reference images in any way. They must be 100% identical to the source.\n2. **Integration**: Incorporate them into a professional, attractive infographic. Use them as core visual elements (e.g., in a comparison, a step-by-step guide, or a feature highlight).\n3. **Composition**: The overall composition should be a high-quality, data-driven infographic with clean typography and balanced layout." 
          });
        }

        // 3. Add the main prompt and safety instructions
        const supportsText = modelName === 'gemini-3.1-flash-image-preview';
        
        let safePrompt = `GENERATE_IMAGE: ${prompt}
Style: Professional flat design or 3D isometric.
Requirements: Clear and clean resolution, no distortion.
Constraints: NO placeholder text, NO tool calls, NO JSON.
CRITICAL: You must output the image part directly. Do not talk about generating it. Do not return JSON.`;

        if (supportsText) {
            safePrompt += `\n\n**TEXT REQUIREMENTS**: Perfectly spelled Korean text using the **Pretendard** font, integrated into design. NO ENGLISH.
**CRITICAL TEXT CONSTRAINT FOR THIS MODEL**: To absolutely prevent Korean text corruption or breaking, keep any generated Korean text EXTREMELY short (maximum 1-3 words). If the requested text is long, summarize it to the most impactful 1-3 words. Perfect spelling is mandatory.`;
        } else {
            safePrompt += `\n\n**TEXT REQUIREMENTS**: NO TEXT ALLOWED. Do not generate any text, typography, or labels in the image.`;
        }

        parts.push({ text: safePrompt });

        const response = await withRetry(() => {
            const config: any = {
                imageConfig: {
                    aspectRatio: aspectRatio as any,
                    imageSize: "512px"
                }
            };

            return ai.models.generateContent({
                model: modelName,
                contents: {
                    parts: parts
                },
                config: config
            });
        });

        for (const part of response.candidates[0]?.content?.parts || []) {
            if (part.inlineData) {
                const cleanBase64 = part.inlineData.data.replace(/[\r\n\s]+/g, '');
                return `data:${part.inlineData.mimeType || 'image/png'};base64,${cleanBase64}`;
            }
            if (part.text) {
                // Check if the model is returning a JSON tool call instead of an image
                if (part.text.includes('"action":') || part.text.includes('"prompt":')) {
                    console.error("Model hallucinated a tool call:", part.text);
                    throw new Error("모델이 이미지를 생성하는 대신 도구 호출을 제안했습니다. 다른 모델을 선택하거나 다시 시도해 주세요.");
                }
                console.log("Model returned text instead of image:", part.text);
            }
        }
        console.error("Full response candidates:", JSON.stringify(response.candidates, null, 2));
        throw new Error("응답에서 이미지 데이터를 찾을 수 없습니다.");
    }
  } catch (error) {
    console.error("Image generation error:", error);
    throw error;
  }
};
