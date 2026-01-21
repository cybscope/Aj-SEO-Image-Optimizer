import { GoogleGenAI, Type } from "@google/genai";
import { ImageMetadata } from "../types";

// Initialize Gemini
// Note: process.env.API_KEY is handled by the environment as per instructions
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

/**
 * Converts a File object to Base64 string for Gemini
 */
const fileToGenerativePart = async (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64String = reader.result as string;
      // Remove data url prefix (e.g. "data:image/jpeg;base64,")
      const base64Data = base64String.split(',')[1];
      resolve(base64Data);
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
};

/**
 * Analyzes the image and generates SEO metadata
 */
export const generateImageMetadata = async (file: File): Promise<ImageMetadata> => {
  try {
    const base64Data = await fileToGenerativePart(file);

    const prompt = `
      Analyze this image for a blog post. Provide SEO-friendly metadata.
      1. A short, descriptive title (max 60 chars).
      2. An alt text description (max 100 chars) describing the image content for accessibility.
      3. A caption that could be used under the image in an article.
      4. A filename suggestion based on the title (lowercase, hyphen-separated).
    `;

    // Using gemini-3-flash-preview as it supports multimodal input and JSON schema responses
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: {
        parts: [
          {
            inlineData: {
              mimeType: file.type,
              data: base64Data
            }
          },
          { text: prompt }
        ]
      },
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            title: { type: Type.STRING },
            altText: { type: Type.STRING },
            caption: { type: Type.STRING },
            fileName: { type: Type.STRING }
          },
          required: ["title", "altText", "caption", "fileName"]
        }
      }
    });

    // Check if text exists before parsing
    const text = response.text;
    if (!text) {
      throw new Error("No response text from Gemini");
    }

    const result = JSON.parse(text);

    return {
      title: result.title || "Untitled Image",
      altText: result.altText || "Image description",
      caption: result.caption || "",
      fileName: result.fileName || "image"
    };

  } catch (error) {
    console.error("Gemini Analysis Failed:", error);
    // Return empty defaults on failure
    return {
      title: "",
      altText: "",
      caption: "",
      fileName: file.name.split('.')[0] // Default to current name without extension
    };
  }
};