import { GoogleGenAI, GenerateContentResponse } from "@google/genai";

// Initialize Gemini Client
// Accessing process.env.API_KEY directly as required.
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const MODEL_FAST = 'gemini-2.5-flash';
const MODEL_REASONING = 'gemini-3-pro-preview';

const SYSTEM_INSTRUCTION = `
You are a live-coding music AI assistant for the app "Braless". 
The user writes code in a syntax similar to Strudel/TidalCycles (JavaScript-based).
Your goal is to generate or modify this musical code based on natural language requests.

Rules:
1. Return ONLY the valid code snippet. Do not wrap in markdown blocks (like \`\`\`). Do not add explanations unless requested.
2. The syntax supports functions like: note(), s() (sound), lpf() (low pass), hpf(), gain(), speed(), clip(), delay(), reverb(), room().
3. Keep patterns rhythmic and loopable.
4. If the user asks for a "drop", make it intense. If "chill", use sine/triangle waves and reverb.
`;

export const geminiService = {
  /**
   * Modifies existing code based on a user instruction.
   */
  async modifyCode(currentCode: string, instruction: string): Promise<string> {
    try {
      const prompt = `
        Current Code:
        ${currentCode}

        Instruction:
        ${instruction}

        Task: Return the modified code that implements the instruction. Keep the vibe but change the parameters or add new lines. Return ONLY raw code.
      `;

      const response: GenerateContentResponse = await ai.models.generateContent({
        model: MODEL_FAST,
        contents: prompt,
        config: {
          systemInstruction: SYSTEM_INSTRUCTION,
          temperature: 0.7,
        },
      });

      return response.text?.trim() || currentCode;
    } catch (error) {
      console.error("Gemini modifyCode error:", error);
      throw error;
    }
  },

  /**
   * Generates a completely new pattern based on a style description.
   */
  async generatePattern(style: string): Promise<string> {
    try {
      const prompt = `Generate a fresh, loopable music pattern in the style of: ${style}. Return ONLY raw code.`;

      const response: GenerateContentResponse = await ai.models.generateContent({
        model: MODEL_FAST,
        contents: prompt,
        config: {
          systemInstruction: SYSTEM_INSTRUCTION,
          temperature: 0.8,
        },
      });

      return response.text?.trim() || "// Error generating pattern";
    } catch (error) {
      console.error("Gemini generatePattern error:", error);
      throw error;
    }
  },

  /**
   * Specific agent behaviors
   */
  async agentAction(agentRole: string, currentCode: string): Promise<string> {
    try {
      let instruction = "";
      if (agentRole === 'Percussionist') {
        instruction = "Add a complex, driving drum beat to this existing code. Use 'bd', 'sd', 'hh' sounds.";
      } else if (agentRole === 'Lead Synth') {
        instruction = "Add a counter-melody using a synth sound on top of this.";
      } else if (agentRole === 'FX Specialist') {
        instruction = "Glitch this up. Change speeds, add random chops, distort it.";
      }

      const prompt = `
        Role: ${agentRole}
        Current Code:
        ${currentCode}
        
        Instruction: ${instruction}
        
        Return the merged result.
      `;

      const response: GenerateContentResponse = await ai.models.generateContent({
        model: MODEL_FAST,
        contents: prompt,
        config: {
          systemInstruction: SYSTEM_INSTRUCTION,
          temperature: 0.9,
        },
      });

      return response.text?.trim() || currentCode;
    } catch (error) {
      console.error("Gemini agentAction error:", error);
      throw error;
    }
  }
};