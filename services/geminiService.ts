import { GoogleGenAI, Type, Schema } from "@google/genai";
import { Panel } from "../types";

const MODEL_NAME = "gemini-2.5-flash";

const panelSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    panels: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          order: { type: Type.INTEGER, description: "The reading order of the panel, starting at 1" },
          ymin: { type: Type.NUMBER, description: "Top Y coordinate percentage (0-100)" },
          xmin: { type: Type.NUMBER, description: "Left X coordinate percentage (0-100)" },
          ymax: { type: Type.NUMBER, description: "Bottom Y coordinate percentage (0-100)" },
          xmax: { type: Type.NUMBER, description: "Right X coordinate percentage (0-100)" },
          description: { type: Type.STRING, description: "Short description of the panel content" }
        },
        required: ["order", "ymin", "xmin", "ymax", "xmax"]
      }
    }
  },
  required: ["panels"]
};

export const analyzeComicPage = async (base64Image: string): Promise<Panel[]> => {
  try {
    const apiKey = process.env.API_KEY;
    if (!apiKey) throw new Error("API Key not found");

    const ai = new GoogleGenAI({ apiKey });
    
    // Strip the data:image/...;base64, prefix if present
    const cleanBase64 = base64Image.replace(/^data:image\/\w+;base64,/, "");

    const response = await ai.models.generateContent({
      model: MODEL_NAME,
      contents: {
        parts: [
          {
            inlineData: {
              mimeType: "image/jpeg", // Assuming JPEG for simplicity, or we could pass it in
              data: cleanBase64
            }
          },
          {
            text: "Analyze this comic book page. Identify all individual panels. Return their bounding box coordinates as percentages (0-100). Order them in the logical reading order (usually left-to-right, top-to-bottom, but respect the comic's flow)."
          }
        ]
      },
      config: {
        responseMimeType: "application/json",
        responseSchema: panelSchema,
        temperature: 0.2 // Lower temperature for more deterministic bounding box detection
      }
    });

    const text = response.text;
    if (!text) return [];

    const data = JSON.parse(text);
    const panels = data.panels as Panel[];

    // Ensure IDs are present
    return panels.map((p, idx) => ({ ...p, id: `panel-${idx}` }));

  } catch (error) {
    console.error("Gemini analysis failed:", error);
    return [];
  }
};
