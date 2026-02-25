import { GoogleGenAI, GenerateContentResponse, Type, Part } from "@google/genai";
import { KeywordSuggestion } from "../types";

const getClient = () => {
  const apiKey = process.env.API_KEY;
  if (!apiKey) {
    throw new Error("API Key is missing. Please set process.env.API_KEY");
  }
  return new GoogleGenAI({ apiKey });
};

// Gemini 3 Pro Preview for High-Quality Reasoning & Text
const TEXT_MODEL = 'gemini-3-pro-preview';
// Gemini 3 Pro Image Preview (Nano Banana 3) for High-Quality Text Rendering
const IMAGE_MODEL = 'gemini-3-pro-image-preview';

export const generateBlogIdeas = async (niche: string): Promise<string> => {
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
      thinkingConfig: { thinkingBudget: 1024 }
    }
  });

  return response.text || "아이디어를 생성할 수 없습니다.";
};

export const generateUSP = async (
  topic: string,
  storeName: string,
  salesService: string
): Promise<string> => {
  const ai = getClient();

  const prompt = `
    You are a top-tier Marketing Strategist and Copywriter.
    
    Analyze the following information:
    - Blog Topic: "${topic}"
    - Brand/Store Name: "${storeName}"
    - Sales Service/Product: "${salesService}"

    **Task**:
    Deduce a powerful **USP (Unique Selling Proposition)** and **Content Strategy** that maximizes the probability of:
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
      thinkingConfig: { thinkingBudget: 1024 }
    }
  });

  return response.text || "전략을 도출할 수 없습니다.";
};

export const suggestRelatedKeywords = async (
  baseTopic: string, 
  storeName?: string,
  salesService?: string,
  postGoal?: string,
  filePart?: { data: string, mimeType: string },
  referenceNote?: string
): Promise<KeywordSuggestion[]> => {
  const ai = getClient();
  
  const promptText = `
    Topic: "${baseTopic}"
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

  try {
    const text = response.text;
    if (!text) return [];
    return JSON.parse(text);
  } catch (e) {
    console.error("Failed to parse keywords", e);
    return [];
  }
};

export const generateTitle = async (
  keyword: string,
  topic: string,
  postGoal?: string,
  referenceNote?: string
): Promise<string> => {
  const ai = getClient();
  const prompt = `
    Create ONE high-performing, **GEO (Generative Engine Optimization)** and **SEO (Search Engine Optimization)** ready blog post title.
    
    Context:
    Topic: ${topic}
    ${postGoal ? `Goal: ${postGoal}` : ""}
    ${referenceNote ? `Reference Note: ${referenceNote}` : ""}
    
    **GEO & SEO GUIDELINES**:
    1. **Keyword Placement**: The keyword "${keyword}" MUST be at the very beginning of the title to maximize search visibility. (e.g., "${keyword}: ...")
    2. **AI Search Optimization**: Use clear, authoritative phrasing that answers a specific user intent directly. Avoid vague metaphors.
    3. **Click-Worthy**: Use powerful words, numbers, or specific benefits to increase CTR.
    4. **Goal Alignment**: The title should attract readers interested in "${postGoal || topic}".
    5. **Length**: Concise but descriptive (under 40 characters if possible).
    
    Output: Return ONLY the title string. No quotes, no explanations.
    Language: Korean.
  `;

  const response = await ai.models.generateContent({
    model: TEXT_MODEL,
    contents: prompt,
    config: {
      temperature: 0.8,
    }
  });
  
  return response.text?.trim() || `${keyword} 관련 추천 포스팅`;
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
  scriptImageParts?: { data: string, mimeType: string }[]
): Promise<string> => {
  const ai = getClient();
  
  const promptText = `
    Create a detailed SEO-optimized blog post outline for the topic: "${topic}".
    ${storeName ? `Store/Brand Name: "${storeName}"` : ""}
    ${salesService ? `Product/Service for Sale: "${salesService}"` : ""}
    ${postGoal ? `**Primary Goal**: "${postGoal}"` : ""}
    ${referenceNote ? `**User Reference Note**: "${referenceNote}". Incorporate these specific instructions or details into the outline.` : ""}
    ${filePart ? "Analyze the attached reference file and incorporate its key points into the structure." : ""}
    ${scriptImageParts && scriptImageParts.length > 0 ? "**VISUAL ANALYSIS**: I have attached 'Script Reference Images'. Analyze these images to understand the atmosphere and context, but do not explicitly describe them in the outline." : ""}
    ${excludedFilePart ? "**CRITICAL CONSTRAINT**: The attached 'EXCLUDED FILE' contains information that MUST NOT appear in the outline. Do not mention or reference its specific contents." : ""}
    
    ${benchmarkingText ? `
    **BENCHMARKING MASTER INSTRUCTION**: 
    I have provided "BENCHMARKING TEXT" below. It is a high-performing content model. 
    1. **Analyze Structure**: Identify its logical flow (e.g., Problem -> Agitation -> Solution).
    2. **Mimic Logic**: Create an outline for the NEW TOPIC that follows the *exact same persuasive steps* as the benchmark.
    3. **Adapt Entities**: Where the benchmark promotes its subject, you must structure the outline to promote "${storeName || 'our brand'}" and "${salesService || 'our service'}" instead.
    ` : ""}
    
    Structure Guidelines:
    1. **Introduction**: MUST include a "Hook" strategy to grab attention immediately. Address the reader's problem related to "${postGoal || topic}".
    2. **Body (H2/H3)**: Structured logic to persuade or inform the reader. 
       - **IMPORTANT**: Designate one section to be presented as a **Table/Chart** (e.g., Feature comparison, Price list, Pros/Cons, Specs).
    3. **Conclusion**: MUST be conversion-focused. Summarize and lead the reader to the specific goal ("${postGoal || 'Action'}").
    
    Output Format:
    1. Introduction (Hook, Problem, Solution)
    2. Key Headings (Format as Blockquote: > Heading)
    3. Sub-points (Format as Blockquote: > Sub-point)
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
      thinkingConfig: { thinkingBudget: 2048 }
    }
  });

  return response.text || "개요를 생성할 수 없습니다.";
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
  scriptImageParts?: { data: string, mimeType: string }[]
): Promise<void> => {
  const ai = getClient();

  const prompt = `
    Write a comprehensive, engaging, and **GEO (Generative Engine Optimization)** and **SEO (Search Engine Optimization)** ready blog post based on the following topic and outline.
    
    Topic: ${topic}
    ${storeName ? `Store/Brand Name: "${storeName}"` : ""}
    ${salesService ? `Product/Service for Sale: "${salesService}"` : ""}
    ${postGoal ? `**ULTIMATE GOAL**: The content must achieve this goal: "${postGoal}"` : ""}
    ${referenceNote ? `**USER REFERENCE NOTE**: "${referenceNote}". This is a specific instruction from the user. You MUST reflect this note in the content.` : ""}
    
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
    5. **Subheadings (Citation Style)**: Do NOT use H1 (#), H2 (##), or H3 (###). ALL subheadings must be formatted as Blockquotes using "> ". Example: > Section Title

    **READABILITY (Spacing - CRITICAL)**: 
    - **Paragraph Structure**: **STRICTLY** end a paragraph after **every 2 sentences**.
    - **Spacing**: Insert a double line break (\\n\\n) after every 2 sentences to create whitespace. Do NOT use single line spacing for the body text.
    - **NO STANDARD HEADERS**: **Strictly Forbidden** to use #, ##, or ### tags in the body. Only use the "> " syntax for section titles.
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
      thinkingConfig: { thinkingBudget: 4096 },
    }
  });

  for await (const chunk of streamResult) {
    if (chunk.text) {
      onChunk(chunk.text);
    }
  }
};

export interface ImagePromptRequest {
  context: string;
  prompt: string;
}

export const generateImagePromptsForPost = async (content: string, hasFaceReference: boolean = false, numberOfImages: number = 4): Promise<ImagePromptRequest[]> => {
  const ai = getClient();
  const isAuto = numberOfImages === 0;

  const prompt = `
    Analyze the blog post content to ${isAuto ? "extract a variable number of (between 4 and 8)" : `extract ${numberOfImages}`} key visual concepts.
    Create ${isAuto ? "a set of" : numberOfImages} high-quality image generation prompts according to the following structure.
    
    ${hasFaceReference ? "**IMPORTANT**: The user has provided a specific FACE REFERENCE photo. Therefore, EVERY image prompt (or at least the majority) MUST explicitly describe a 'main character' or 'person' (who matches the reference) acting as the presenter or experiencing the scenario. This allows the face reference to be applied effectively." : ""}

    **CONTENT STRUCTURE**:
    - **Image 1 (Hook)**: Visualizes the problem or a shocking fact to grab attention.
    - **Middle Images**: Visualize key concepts, steps, solutions, or benefits in a logical narrative flow.
    - **Last Image (Action/Conclusion)**: Summarizes and encourages action.

    **VISUAL DESIGN STYLE**:
    - Choose ONE consistent theme: "Professional Flat Design (Vector Art)" OR "Sophisticated 3D Isometric".
    - **Quality**: 8K resolution, clean, no AI distortion, no excessive glaze.
    - **Layout**: Mobile-optimized, central or Z-pattern.
    - **Constraint**: DO NOT put image numbers on the image.

    **STRICT TEXT RULES (KOREAN ONLY)**:
    1. **Line Count**: **MUST include AT LEAST 2 LINES of text**.
    2. **Structure**:
       - **Line 1 (Headline)**: Impactful, Bold Sans-serif font.
       - **Line 2 (Subtitle)**: Descriptive, smaller.
    3. **Legibility**: Text must be perfectly legible.
    4. **Privacy**: Do not include contact info unless explicitly present in content.

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
    - **Language**: Korean Only.
    - **Content**: The keyword "${keyword}" MUST be the main focus.
    - **Subtitle**: Add a short, intriguing subtitle below the keyword (e.g., "Must Read", "2026 Trend"). **Total text must be at least 2 lines.**
    - **Style**: 3D Glossy Text, Neon Light, or Bold Typography with heavy drop shadows.
    
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

    // 1. Handle Face Consistency FIRST (Critical Priority)
    if (faceImagePart) {
      parts.push({ inlineData: faceImagePart });
      parts.push({ text: "REFERENCE ID: CHARACTER_FACE. The image above is the Reference Face. You must generate an image where the main character possesses this EXACT face. \n\n**CRITICAL REQUIREMENT**:\n1. **Face Consistency**: The face must be 100% consistent with the reference. Do not deform, caricature, or alter the facial structure/identity. \n2. **Expression/Pose**: You may change the facial expression (smile, serious) and head angle/pose as needed by the prompt, but the *identity* must remain locked. \n3. **Integration**: Blend the face naturally into the requested artistic style (Flat Design or 3D Isometric) while keeping the identity recognizable." });
    }
    
    // 2. Handle other reference images (Logo, Context)
    if (referenceImages && referenceImages.length > 0) {
      referenceImages.forEach(img => {
          parts.push({ inlineData: img });
      });
      // Append instruction to use the images without distortion
      parts.push({ 
        text: "Instructions: Incorporate the provided reference image(s) or logo into the generated image. Ensure the logo/image remains recognizable and is not distorted. If the image is a logo, place it tastefully." 
      });
    }

    // 3. Add the main prompt and safety instructions
    const safePrompt = prompt + " Ensure the image is a professional flat design or 3D isometric style as requested. High-resolution, no distortion. All Korean text must be perfectly spelled, bold sans-serif, and arranged in at least two lines. Do not use pseudo-text.";
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
