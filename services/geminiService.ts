import { GoogleGenAI } from "@google/genai";
import { Mode, ModeType, Project, Message, Role, APIProvider, ImageSettings } from "../types";

/**
 * Constructs the System Instruction by combining:
 * 1. The Mode's base persona
 * 2. The Project's SHARED memory (Global context)
 * 3. The Project's MODE-SPECIFIC memory (Private context)
 */
const constructContextualSystemPrompt = (mode: Mode, project: Project | null): string => {
  let instruction = `You are running in mode: ${mode.name} (${mode.provider}).\n${mode.systemPrompt}`;

  if (project) {
    instruction += `\n\n=== 🗂️ ACTIVE PROJECT: ${project.name} ===\n`;
    instruction += `Description: ${project.description}\n`;
    
    // 1. Inject Shared Memory
    instruction += `\n--- 🌐 SHARED MEMORY (Visible to all modes) ---\n`;
    instruction += `Summary: ${project.memory.sharedContext.summary}\n`;
    instruction += `Key Facts: ${JSON.stringify(project.memory.sharedContext.keyFacts, null, 2)}\n`;

    // 2. Inject Mode-Specific Memory
    const privateMem = project.memory.modeContext[mode.id];
    if (privateMem) {
        instruction += `\n--- 🔒 MODE MEMORY (Visible only to ${mode.name}) ---\n`;
        if (privateMem.specificInstructions) {
            instruction += `Specific Instructions: ${privateMem.specificInstructions}\n`;
        }
        if (privateMem.data) {
            instruction += `Structured Data: ${JSON.stringify(privateMem.data, null, 2)}\n`;
        }
        if (privateMem.lastState) {
            instruction += `Last Known State: ${privateMem.lastState}\n`;
        }
    } else {
        instruction += `\n(No specific memory exists for this mode yet)\n`;
    }
    
    instruction += `\nUse this structured context to inform your response. Do not hallucinate details not in memory.`;
  }

  return instruction;
};

/**
 * Routing Layer
 * Maps the requested "Provider" (Deepseek, Fal, Tavily) to the best available Google GenAI model configuration.
 */
export const sendMessageToGemini = async (
  history: Message[],
  mode: Mode,
  project: Project | null,
  newMessage: string,
  attachments: { type: string, data: string }[] = [],
  imageSettings?: ImageSettings
): Promise<{ text: string; images?: string[]; groundingMetadata?: any }> => {
  
  if (!process.env.API_KEY) {
    return { text: "Error: No API Key found. Please set REACT_APP_API_KEY or process.env.API_KEY." };
  }

  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const systemInstruction = constructContextualSystemPrompt(mode, project);

  try {
    // === ROUTING LOGIC ===

    // 1. FAL.AI MODE (Mapped to Gemini Image Generation)
    // Uses `gemini-2.5-flash-image` (Nano Banana equivalent)
    if (mode.provider === APIProvider.FAL_AI) {
      const aspectRatio = imageSettings?.aspectRatio || "1:1";
      // Note: Output format is handled by converting the returned base64, 
      // but strictly speaking Gemini outputMimeType for images isn't always configurable in the flash-image model same way as Imagen.
      // We will simulate the "Format" selection by just handling the data appropriately in the UI, 
      // as the API returns raw data.

      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash-image', 
        contents: { parts: [{ text: newMessage }] },
        config: {
            imageConfig: { 
                aspectRatio: aspectRatio 
            }
        }
      });

      const images: string[] = [];
      let textResponse = `Generated with Fal.ai (Nano Banana Pro emulation) in ${aspectRatio} ratio:`;

      if (response.candidates && response.candidates[0].content.parts) {
          for (const part of response.candidates[0].content.parts) {
              if (part.inlineData) {
                  images.push(`data:${imageSettings?.format || 'image/png'};base64,${part.inlineData.data}`);
              } else if (part.text) {
                  textResponse = part.text;
              }
          }
      }
      return { text: textResponse, images };
    }

    // 2. TAVILY MODE (Mapped to Gemini Search Grounding)
    if (mode.provider === APIProvider.TAVILY) {
       const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash', // Fast model for search aggregation
        contents: newMessage,
        config: {
          systemInstruction: systemInstruction,
          tools: [{ googleSearch: {} }] // The "Tavily" equivalent capability
        }
      });
      return {
        text: response.text || "No results found via Research API.",
        groundingMetadata: response.candidates?.[0]?.groundingMetadata
      };
    }

    // 3. DEEPSEEK MODE (Mapped to Gemini 3 Pro with High Reasoning)
    // Used for Ebooks and Landing Page Logic
    if (mode.provider === APIProvider.DEEPSEEK) {
        // Construct history
        const chatHistory = history.map(msg => ({
            role: msg.role === Role.USER ? 'user' : 'model',
            parts: [{ text: msg.content }]
        }));
        
        const chat = ai.chats.create({
            model: 'gemini-3-pro-preview', // Superior reasoning model
            history: chatHistory,
            config: {
                systemInstruction: systemInstruction,
                thinkingConfig: { thinkingBudget: 1024 } // Simulate "Deep Think" behavior
            }
        });
        
        const result = await chat.sendMessage({ message: newMessage });
        return { text: result.text || "" };
    }

    // 4. GENERAL MODE (Gemini 2.5 Flash)
    const chatHistory = history.map(msg => ({
        role: msg.role === Role.USER ? 'user' : 'model',
        parts: [{ text: msg.content }]
    }));

    const chat = ai.chats.create({
        model: 'gemini-2.5-flash',
        history: chatHistory,
        config: { systemInstruction }
    });

    // Handle attachments (Visual input)
    if (attachments.length > 0) {
        const parts: any[] = attachments.map(att => ({
            inlineData: { mimeType: att.type, data: att.data }
        }));
        parts.push({ text: newMessage });
        
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: { role: 'user', parts: parts },
            config: { systemInstruction }
        });
        return { text: response.text || "" };
    }

    const result = await chat.sendMessage({ message: newMessage });
    return { text: result.text || "" };

  } catch (error: any) {
    console.error("API Gateway Error:", error);
    return { text: `System Error (${mode.provider}): ${error.message}` };
  }
};