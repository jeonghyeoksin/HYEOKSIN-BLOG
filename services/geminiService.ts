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

export const testConnection = async (): Promise<{ success: boolean; message: string }> => {
  try {
    const ai = getClient();
    // 연결 테스트용으로 더 가볍고 가용성이 높은 flash 모델을 사용합니다.
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: "Connection test. Reply with 'OK'.",
    });
    if (response.text) {
      return { success: true, message: "연결 성공! API 키가 정상적으로 작동합니다." };
    }
    return { success: false, message: "연결 실패: 응답을 받을 수 없습니다." };
  } catch (error: any) {
    console.error("Connection test error:", error);
    
    // 503 에러 (모델 과부하) 처리
    if (error.message?.includes("503") || error.message?.includes("overloaded") || error.message?.includes("수요가 급증")) {
      return { 
        success: false, 
        message: "현재 Google 서버의 일시적인 과부하로 인해 연결 확인이 지연되고 있습니다. 잠시 후 다시 시도해 주세요. (API 키 자체는 정상일 가능성이 높습니다.)" 
      };
    }

    return { 
      success: false, 
      message: error.message?.includes("entity was not found") 
        ? "API 키가 올바르지 않거나 권한이 없습니다. 다시 설정해주세요." 
        : `연결 실패: ${error.message || "알 수 없는 오류"}` 
    };
  }
};

// Gemini 3 Flash Preview for High Availability, Speed & Higher Quota
const TEXT_MODEL = 'gemini-3-flash-preview';
// Gemini 3 Pro Image Preview for High-Quality Image Generation
const IMAGE_MODEL = 'gemini-3-pro-image-preview';

const handleApiError = (error: any, fallbackMessage: string): string => {
  console.error("Gemini API Error:", error);
  if (error.message?.includes("429") || error.message?.includes("quota") || error.message?.includes("RESOURCE_EXHAUSTED")) {
    return "API 사용량이 일일 할당량을 초과했습니다. 잠시 후 다시 시도하거나 다른 API 키를 사용해 주세요.";
  }
  if (error.message?.includes("503") || error.message?.includes("overloaded") || error.message?.includes("수요가 급증")) {
    return "현재 Google 서버의 일시적인 과부하로 인해 요청을 처리할 수 없습니다. 잠시 후 다시 시도해 주세요.";
  }
  if (error.message?.includes("entity was not found") || error.message?.includes("API_KEY_INVALID")) {
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

    const response = await ai.models.generateContent({
      model: TEXT_MODEL,
      contents: prompt,
      config: {
        temperature: 0.8,
        // thinkingLevel is the correct parameter for Gemini 3 series
        thinkingConfig: { thinkingLevel: ThinkingLevel.LOW }
      }
    });

    return response.text || "아이디어를 생성할 수 없습니다.";
  } catch (error: any) {
    throw new Error(handleApiError(error, "블로그 아이디어 생성 실패"));
  }
};

export const generateUSP = async (
  topic: string,
  storeName: string,
  salesService: string,
  blogCategory?: string,
  blogPlatform?: string
): Promise<string> => {
  try {
    const ai = getClient();

    const prompt = `
      You are a top-tier Marketing Strategist and Copywriter.
      
      Analyze the following information:
      - Blog Topic: "${topic}"
      ${blogCategory ? `- Blog Category: "${blogCategory}"` : ""}
      ${blogPlatform ? `- Blog Platform: "${blogPlatform}"` : ""}
      - Brand/Store Name: "${storeName}"
      - Sales Service/Product: "${salesService}"

      **Task**:
      Deduce a powerful **USP (Unique Selling Proposition)** and **Content Strategy** that is highly optimized for the specified Blog Category and Platform. It must maximize the probability of:
      1. **Customer Inquiries** (Lead Generation)
      2. **Sales Conversion** (Purchase)

      **Output Requirements**:
      - Identify the core pain point of the target audience related to the topic.
      - Explain how this specific brand/service solves it better than others.
      - Formulate a specific "Goal of the Post" that acts as a strategic guideline for the writer.
      - **Format**: Just return the strategic paragraph (approx 3-4 lines) that describes the selling point and the goal. Do not use bullet points.
      - **Language**: Korean.
    `;

    const response = await ai.models.generateContent({
      model: TEXT_MODEL,
      contents: prompt,
      config: {
        temperature: 0.7,
        thinkingConfig: { thinkingLevel: ThinkingLevel.LOW }
      }
    });

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

    const response = await ai.models.generateContent({
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
    });

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

    const response = await ai.models.generateContent({
      model: TEXT_MODEL,
      contents: prompt,
      config: {
        temperature: 0.8,
        responseMimeType: "application/json",
      }
    });
    
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
  servicePriceImageParts?: { data: string, mimeType: string }[]
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
      3. **Intro Strategy**: ${blogCategory === '맛집 리뷰' ? "Start with a natural, authentic, experiential tone from a visitor's perspective. DO NOT use a Q&A format for the introduction." : "Start the introduction with a Q&A structure that provides the conclusion first. Plan to use specific numbers, dates, and clear sources to build absolute trust."}
      4. **Curiosity Resolution**: Do not give everything away immediately after the intro. Resolve the reader's curiosity step-by-step throughout the body.
      5. **Readability & Formatting**: ${blogCategory === '맛집 리뷰' ? "You MUST write with center-aligned formatting in mind. **CRITICAL**: Each line MUST NOT exceed 18 characters (Korean). You MUST insert a hard line break (Enter) after every 18 characters or less. Furthermore, you MUST group exactly 2 lines together, and then insert an empty line (double Enter) to create a new paragraph. This 2-line paragraph rule is absolute." : "Plan for extremely short paragraphs (max 3 sentences)."}
      6. **Structure**: ${blogCategory === '맛집 리뷰' ? "Use at least 3 subheadings. **CRITICAL**: You MUST format ALL subheadings as blockquotes using the `>` symbol (e.g., `> ## Subheading`)." : "Use at least 3 subheadings (H2, H3) to organize the content clearly."}
      7. **Visual & Rich Media**: Actively incorporate markdown tables to increase reader dwell time. DO NOT use any bracket placeholders like "[ ]" (e.g., do not write "[이미지 삽입]"). The text must be clean and ready to copy-paste.
      8. **Keyword Placement**: The target keyword MUST be placed at the very beginning of the title.

      ${benchmarkingText ? `
      **BENCHMARKING MASTER INSTRUCTION**: 
      I have provided "BENCHMARKING TEXT" below. It is a high-performing content model. 
      1. **Analyze Structure**: Identify its logical flow (e.g., Problem -> Agitation -> Solution).
      2. **Mimic Logic**: Create an outline for the NEW TOPIC that follows the *exact same persuasive steps* as the benchmark.
      3. **Adapt Entities**: Where the benchmark promotes its subject, you must structure the outline to promote "${storeName || 'our brand'}" and "${salesService || 'our service'}" instead.
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
      ` : ""}
      ${naverDataText}
      
      Structure Guidelines:
      1. **Introduction**: MUST include a "Hook" strategy to grab attention immediately. Address the reader's problem related to "${postGoal || topic}".
      2. **Body (H2/H3)**: Structured logic to persuade or inform the reader. 
         - **IMPORTANT**: Designate one section to be presented as a **Table/Chart** (e.g., Feature comparison, Price list, Pros/Cons, Specs).
      3. **Conclusion**: MUST be conversion-focused. Summarize and lead the reader to the specific goal ("${postGoal || 'Action'}").
      
      Output Format:
      1. Introduction (Hook, Problem, Solution)
      2. Key Headings (Format as plain Bold text: **Heading**)
      3. Sub-points (Format as plain Bold text: **Sub-point**)
      4. Conclusion (Summary, Persuasive Call to Action)
      
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

    const response = await ai.models.generateContent({
      model: TEXT_MODEL,
      contents: { parts },
      config: {
        temperature: 0.7,
        thinkingConfig: { thinkingLevel: ThinkingLevel.LOW },
        tools: [{ googleSearch: {} }]
      }
    });

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
  excludedFilePart?: { data: string, mimeType: string },
  benchmarkingText?: string,
  referenceNote?: string,
  scriptImageParts?: { data: string, mimeType: string }[],
  mustIncludeContent?: string,
  blogCategory?: string,
  blogPlatform?: string,
  servicePriceText?: string,
  servicePriceImageParts?: { data: string, mimeType: string }[]
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
      3. **Intro Strategy**: ${blogCategory === '맛집 리뷰' ? "Start with a natural, authentic, experiential tone from a visitor's perspective. DO NOT use a Q&A format for the introduction." : "Start the introduction with a Q&A structure that provides the conclusion first. Use specific numbers, dates, and clear sources to build absolute trust and increase the chance of being cited by AI."}
      4. **Curiosity Resolution (Prompt Design)**: Do not give everything away immediately after the intro. Resolve the reader's curiosity step-by-step throughout the body.
      5. **Readability & Formatting**: ${blogCategory === '맛집 리뷰' ? "You MUST write with center-aligned formatting in mind. **CRITICAL**: Each line MUST NOT exceed 18 characters (Korean). You MUST insert a hard line break (Enter) after every 18 characters or less. Furthermore, you MUST group exactly 2 lines together, and then insert an empty line (double Enter) to create a new paragraph. This 2-line paragraph rule is absolute." : "Keep paragraphs extremely short—maximum 3 sentences per paragraph."}
      6. **Structure**: ${blogCategory === '맛집 리뷰' ? "Use at least 3 subheadings. **CRITICAL**: You MUST format ALL subheadings as blockquotes using the `>` symbol (e.g., `> ## Subheading`)." : "Use at least 3 subheadings (H2, H3) to organize the content clearly."}
      7. **Visual & Rich Media**: Do not just list text. Actively incorporate markdown tables to increase reader dwell time. DO NOT use any bracket placeholders like "[ ]" (e.g., do not write "[이미지 삽입]"). The text must be clean and ready to copy-paste.
      8. **Keyword Placement**: The target keyword MUST be placed at the very beginning of the title.

      ${benchmarkingText ? `
      **BENCHMARKING & MIMICRY MODE ACTIVATED**:
      I have provided "BENCHMARKING TEXT". You MUST treat this text as a "Golden Template".
      
      **YOUR MISSION**:
      1. **Analyze the DNA**: Absorb the benchmark's **tone** (e.g., emotional, cynical, excited), **sentence length rhythm**, and **narrative structure**.
      2. **Clone the Logic, Change the Content**: 
         - If the benchmark tells a story about a "Coffee Shop failure", you must tell a similar story about a "${topic} failure".
         - If the benchmark lists "3 reasons to buy X", you must list "3 reasons to buy ${salesService || 'this service'}" using the same persuasive logic.
      3. **Brand Adaptation**: Replace the benchmark's brand/service with "${storeName || 'our brand'}" and "${salesService || 'our service'}". The hero of this story is now "${storeName}".
      4. **Simulated Document Avoidance**: You must write a completely new article to avoid "Similar Document" penalties by search engines. 
         - **Structure Mimicry**: Copy the *flow* and *logic*, but NOT the *phrasing*.
         - **Sentence Transformation**: Invert sentence structures, use different vocabulary, and change the tone slightly if needed.
         - **Entity Swapping**: Ensure the old brand/service is completely removed and replaced with the new one.
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
      
      ${blogPlatform === '네이버' ? `**NAVER SMARTPLACE INTEGRATION (MANDATORY)**: Since the platform is '네이버', you MUST use the provided NAVER LOCAL API DATA and the Google Search tool to find the "네이버 스마트플레이스" (Naver Map/Place) information for "${storeName || topic}". You MUST extract real data (address, hours, menu items, prices, parking, features) and write the review based entirely on this real data. Do not invent menu items or hours; use the actual data.` : ""}
      ` : ""}
      ${naverDataText}

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
      5. **Subheadings**: Subheadings MUST be formatted as plain Bold text (e.g., **Subheading**). DO NOT use H1 (#), H2 (##), H3 (###), or Blockquotes (>). DO NOT apply any colors to subheadings; they must remain default black.

      **READABILITY (Spacing - CRITICAL)**: 
      - **Paragraph Structure**: **STRICTLY** end a paragraph after **every 2 sentences**.
      - **Spacing**: Insert a double line break (\\n\\n) after every 2 sentences to create whitespace. Do NOT use single line spacing for the body text.
      - **NO IMAGE DESCRIPTIONS**: Do NOT write text describing the reference images (e.g. "Image 1 shows..."). The text should focus solely on the topic information.
      - **NO KEYWORD LISTS**: Do NOT output a list of "Target Keywords" or "Keywords". The keywords must be naturally integrated into the flow of the text. Do NOT print the outline notes about keywords.
      
      - **DO NOT** write the Main Title (H1) at the start.
      - Korean language only.
      - **Terminology**: Use '여러분' (Everyone) instead of '당신' (You).
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
  } catch (error: any) {
    throw new Error(handleApiError(error, "본문 생성 실패"));
  }
};

export interface ImagePromptRequest {
  context: string;
  prompt: string;
}

export const generateImagePromptsForPost = async (content: string, hasFaceReference: boolean = false, numberOfImages: number = 4, hasReferenceImages: boolean = false): Promise<ImagePromptRequest[]> => {
  const ai = getClient();
  const isAuto = numberOfImages === 0;

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
    - **Style**: "Modern Professional Infographic" with a clean, high-end aesthetic.
    - **Theme**: Choose ONE consistent theme: "Professional Flat Design (Vector Art)" OR "Sophisticated 3D Isometric".
    - **Quality**: 8K resolution, clean, no AI distortion, no excessive glaze.
    - **Layout**: Mobile-optimized, central or Z-pattern. Use clear visual hierarchy.
    - **Constraint**: DO NOT put image numbers on the image.

    **STRICT TEXT RULES (KOREAN ONLY - CRITICAL)**:
    1. **Line Count**: **MUST include AT LEAST 2 LINES of attractive Korean text**.
    2. **Structure**:
       - **Line 1 (Headline)**: Impactful, Bold Sans-serif font.
       - **Line 2 (Subtitle)**: Descriptive, smaller.
    3. **Legibility & Accuracy**: Text must be perfectly legible and aesthetically pleasing. **ABSOLUTELY NO KOREAN TEXT CORRUPTION (깨짐)**. If the text is too long or complex and might cause corruption, **SUMMARIZE and SHORTEN** it to ensure perfect rendering.
    4. **NO ENGLISH**: **DO NOT include any English text** in the image. This is a strict requirement.
    5. **Privacy**: Do not include contact info unless explicitly present in content.
    6. **NO PLACEHOLDERS**: **ABSOLUTELY FORBIDDEN** to include placeholder text like "<IMAGE>", "IMAGE 1", "[IMAGE]", or any file names in the image. Only include the specified Korean headline and subtitle.

    **Prompt Format (English)**:
    - Detailed visual description.
    - **CRITICAL INSTRUCTION**: Explicitly write: "Render the Korean text '[Line 1 Text]' in a massive, bold Sans-serif font. Directly below it, render '[Line 2 Text]' in a clean font. Text must be perfectly spelled in Korean Hangul."

    Return JSON array of ${isAuto ? "objects (length between 4 and 8, determined by content length)" : `${numberOfImages} objects`}:
    - 'context': Korean description.
    - 'prompt': The English prompt for the model.

    Content snippet: ${content.substring(0, 4000)}...
  `;

  const response = await ai.models.generateContent({
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
  });

  try {
     return JSON.parse(response.text || "[]");
  } catch (e) {
      return [];
  }
};

export const generateThumbnailPrompt = async (keyword: string, content: string): Promise<string> => {
  const ai = getClient();
  const prompt = `
    Create a prompt for a **World-Class Blog Thumbnail** (1:1 ratio).
    
    **DESIGN VISION**:
    - **Vibe**: "Viral YouTube Thumbnail", "Netflix Poster", "High-End Brand Identity".
    - **Composition**: Central focus, dynamic background, depth of field.
    
    **TEXT REQUIREMENTS**:
    - **Language**: Korean Only. **NO ENGLISH TEXT ALLOWED**. This includes small labels or decorative text.
    - **Content**: The keyword "${keyword}" MUST be the main focus.
    - **Subtitle**: Add a short, intriguing subtitle below the keyword (e.g., "Must Read", "2026 Trend"). **Total text must be at least 2 lines.**
    - **Accuracy**: **ABSOLUTELY NO KOREAN TEXT CORRUPTION (깨짐)**. If the text is too long or complex, **SUMMARIZE/SHORTEN** it to ensure perfect rendering.
    - **Style**: 3D Glossy Text, Neon Light, or Bold Typography with heavy drop shadows.
    - **NO PLACEHOLDERS**: **ABSOLUTELY FORBIDDEN** to include placeholder text like "<IMAGE>", "IMAGE 1", or any image labels.
    
    The output prompt must be in English.
    Example: "A cinematic 3D render of [Subject]. Center stage: The text '${keyword}' in massive, glowing gold Korean characters. Below it, a smaller white text reading '[Subtitle]' adds context. Background is a deep, rich gradient with floating particles. 8k resolution."
    
    Content context: ${content.substring(0, 800)}...
  `;
  
  const response = await ai.models.generateContent({
    model: TEXT_MODEL,
    contents: prompt,
  });
  return response.text || `A creative 3D typography design of the word "${keyword}" in Korean, surrounded by elements matching the blog topic. No English text.`;
};

export const generateBlogImage = async (
  prompt: string, 
  aspectRatio: string = "16:9",
  referenceImages: { data: string, mimeType: string }[] = [],
  faceImagePart?: { data: string, mimeType: string }
): Promise<string | null> => {
  const ai = getClient();
  try {
    const parts: Part[] = [];

    // 1. Handle Person Consistency FIRST (Critical Priority)
    if (faceImagePart) {
      parts.push({ inlineData: faceImagePart });
      parts.push({ text: "REFERENCE ID: PERSON_IMAGE. The image above is the Reference Person. You must generate an image where this exact person is included without any distortion or modification. \n\n**CRITICAL REQUIREMENT**:\n1. **Zero Distortion**: The person must be 100% identical to the reference. Do not deform, caricature, or alter the person in any way. \n2. **Integration**: Incorporate the person naturally into the scene while keeping their appearance completely unmodified." });
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
    const safePrompt = prompt + " Ensure the image is a professional flat design or 3D isometric style as requested. High-resolution, no distortion. All Korean text must be perfectly spelled, bold sans-serif, and arranged in at least two lines. The text must be visually attractive and integrated into the design. ABSOLUTELY NO KOREAN TEXT CORRUPTION. If text is complex, simplify it. NO ENGLISH TEXT AT ALL. ABSOLUTELY NO placeholder text like '<IMAGE>', 'IMAGE 1', or file names should appear in the image.";
    parts.push({ text: safePrompt });

    const response = await ai.models.generateContent({
      model: IMAGE_MODEL,
      contents: {
        parts: parts
      },
      config: {
        imageConfig: {
          aspectRatio: aspectRatio as any,
          imageSize: "1K" // gemini-3-pro-image-preview supports this
        }
      }
    });

    for (const part of response.candidates[0]?.content?.parts || []) {
        if (part.inlineData) {
            const cleanBase64 = part.inlineData.data.replace(/[\r\n\s]+/g, '');
            return `data:${part.inlineData.mimeType || 'image/png'};base64,${cleanBase64}`;
        }
    }
    return null;
  } catch (error) {
    console.error("Image generation error:", error);
    return null;
  }
};
