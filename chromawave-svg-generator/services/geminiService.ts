import { GoogleGenAI, Type } from "@google/genai";
import { WaveConfig } from "../types";
import { DEFAULT_CONFIG } from "../constants";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const generateWaveConfig = async (userPrompt: string): Promise<WaveConfig> => {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: `Generate a JSON configuration for a wave visualization based on this description: "${userPrompt}".
      
      The configuration controls a symmetrical, multi-layered animated visualization of smooth, intertwining ribbon shapes.
      
      - spikeCount: Integer between 100 and 300 (curve resolution).
      - amplitude: Integer between 100 and 400 (height of the wave crests).
      - frequency: Float between 0.01 and 0.08 (how many waves appear on screen).
      - speed: Float between 0.005 and 0.05.
      - warmColors: Array of hex color strings (gradient 1).
      - coolColors: Array of hex color strings (gradient 2).
      - strokeWidth: Integer 0-2.
      - opacity: Float between 0.4 and 1.0.
      - blendMode: One of 'normal', 'multiply', 'screen', 'overlay', 'lighten', 'color-dodge'.

      Style Guide:
      - "Liquid/Fluid": Frequency 0.02, High Amplitude, Screen/Overlay.
      - "Neon/Cyberpunk": High brightness colors, Color-dodge.
      - "Calm/Gentle": Low Speed, Low Frequency, Normal blend.
      - "Storm/Chaos": High Frequency, High Speed, High Amplitude.
      `,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            spikeCount: { type: Type.INTEGER },
            amplitude: { type: Type.NUMBER },
            frequency: { type: Type.NUMBER },
            speed: { type: Type.NUMBER },
            warmColors: { 
              type: Type.ARRAY,
              items: { type: Type.STRING } 
            },
            coolColors: { 
              type: Type.ARRAY,
              items: { type: Type.STRING } 
            },
            strokeWidth: { type: Type.NUMBER },
            opacity: { type: Type.NUMBER },
            blendMode: { type: Type.STRING }
          },
          required: ["spikeCount", "amplitude", "frequency", "speed", "warmColors", "coolColors", "opacity", "blendMode"]
        }
      }
    });

    const text = response.text;
    if (!text) return DEFAULT_CONFIG;
    
    const parsed = JSON.parse(text);
    return { ...DEFAULT_CONFIG, ...parsed }; // Merge with default to be safe
  } catch (error) {
    console.error("Failed to generate config:", error);
    return DEFAULT_CONFIG;
  }
};