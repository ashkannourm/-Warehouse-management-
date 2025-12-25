
import { GoogleGenAI } from "@google/genai";
import { ImageSize } from "./types";

export const generateProductImage = async (prompt: string, size: ImageSize): Promise<string | null> => {
  try {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    // Guideline: Upgrade to 'gemini-3-pro-image-preview' if user requests 2K or 4K. 
    // Otherwise use 'gemini-2.5-flash-image' for general image generation tasks.
    const model = (size === '2K' || size === '4K') ? 'gemini-3-pro-image-preview' : 'gemini-2.5-flash-image';
    
    const response = await ai.models.generateContent({
      model: model,
      contents: {
        parts: [{ text: prompt }],
      },
      config: {
        imageConfig: {
          aspectRatio: "1:1",
          imageSize: size
        }
      },
    });

    for (const part of response.candidates?.[0]?.content?.parts || []) {
      // Guideline: Find the image part, do not assume it is the first part.
      if (part.inlineData) {
        return `data:image/png;base64,${part.inlineData.data}`;
      }
    }
    return null;
  } catch (error: any) {
    console.error("Image Generation Error:", error);
    if (error.message?.includes("Requested entity was not found")) {
        throw new Error("RESELECT_KEY");
    }
    throw error;
  }
};
