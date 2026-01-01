
import { GoogleGenAI, Modality, Type } from "@google/genai";
import { Character, StoryboardPanel } from "../types";

export class GeminiService {
  async enhanceText(text: string, style: 'professional' | 'funny' | 'concise' | 'creative') {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    try {
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: `Rewrite the following text to be more ${style}. Keep it around the same length. Only return the rewritten text, no commentary: \n\n"${text}"`,
        config: {
          temperature: 0.7,
        }
      });
      return response.text || 'Failed to generate content.';
    } catch (error) {
      console.error('Gemini API Error:', error);
      throw error;
    }
  }

  async checkEvilTags(text: string): Promise<{ is_safe: boolean; found_tags: string[] }> {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    
    const schema = {
      type: Type.OBJECT,
      properties: {
        is_safe: {
          type: Type.BOOLEAN,
          description: "True if no malicious tags or attributes are found, false otherwise."
        },
        found_tags: {
          type: Type.ARRAY,
          description: "A list of strings, where each string is a potentially malicious tag or attribute that was found.",
          items: {
            type: Type.STRING
          }
        }
      },
      required: ['is_safe', 'found_tags']
    };

    try {
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: `You are a web security expert. Analyze the following text for any potentially malicious HTML tags or attributes that could be used for cross-site scripting (XSS) or other injection attacks. Scrutinize tags like <script>, <iframe>, <img>, <a>, <svg>, <object>, and attributes like onerror, onload, onclick, href="javascript:...". Return ONLY a JSON object based on the provided schema. Text to analyze: \n\n'${text}'`,
        config: {
          responseMimeType: "application/json",
          responseSchema: schema,
        },
      });

      const parsedResponse = JSON.parse(response.text.trim());
      return parsedResponse;
    } catch (error) {
      console.error('Gemini API Error:', error);
      throw error;
    }
  }

  async generatePodcastAudio(script: string, speakers: { name: string, voice: string }[]): Promise<string> {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

    const speakerNames = speakers.map(s => s.name).join(' and ');
    const prompt = `TTS the following conversation between ${speakerNames}:\n${script}`;
    
    const speakerVoiceConfigs = speakers.map(speaker => ({
      speaker: speaker.name,
      voiceConfig: {
        prebuiltVoiceConfig: { voiceName: speaker.voice }
      }
    }));

    try {
      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash-preview-tts",
        contents: [{ parts: [{ text: prompt }] }],
        config: {
          responseModalities: [Modality.AUDIO],
          speechConfig: {
            multiSpeakerVoiceConfig: {
              speakerVoiceConfigs: speakerVoiceConfigs
            }
          }
        }
      });

      const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
      if (!base64Audio) {
        throw new Error("API did not return audio data.");
      }
      return base64Audio;
    } catch (error) {
      console.error('Gemini API Error:', error);
      throw error;
    }
  }

  async generateVideoScript(topic: string, style: string, duration: string, audience: string, extraPoints: string): Promise<string> {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

    const prompt = `
      You are an expert video scriptwriter. Create a video script based on the following details.
      The script must be well-structured, engaging, and easy to follow.

      **Video Topic:** ${topic}
      **Style/Tone:** ${style}
      **Target Audience:** ${audience}
      **Estimated Duration:** ${duration}
      ${extraPoints ? `**Key Points to Include:**\n${extraPoints}` : ''}

      Structure the script with clear headings:
      - **TITLE:** A catchy title for the video.
      - **HOOK:** A strong opening (1-2 sentences) to grab the viewer's attention.
      - **SCENE 1:** [Visual description of the scene].\n  NARRATOR/HOST: [Spoken words].
      - **SCENE 2:** [Visual description of the scene].\n  NARRATOR/HOST: [Spoken words].
      - (Continue with more scenes as needed to fit the duration and topic).
      - **OUTRO:** A concluding summary.
      - **CALL TO ACTION:** A final prompt for the viewer (e.g., like, subscribe, comment).

      Ensure the visual descriptions are helpful for a video editor or animator. The narration should be clear and conversational.
    `;

    try {
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: prompt,
        config: {
          temperature: 0.75,
        }
      });
      return response.text || 'Failed to generate a script. Please try again.';
    } catch (error) {
      console.error('Gemini API Error:', error);
      throw error;
    }
  }

  async generateCharacterImage(description: string): Promise<string> {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    try {
      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash-image',
        contents: {
          parts: [{ text: `Full-body character portrait of: ${description}, clean background, cinematic lighting` }],
        },
      });
      
      let imagePart = null;
      for (const part of response.candidates[0].content.parts) {
        if (part.inlineData) {
          imagePart = part;
          break;
        }
      }

      if (imagePart && imagePart.inlineData) {
        return imagePart.inlineData.data; // returns base64 string
      } else {
        throw new Error("The AI did not return an image.");
      }

    } catch (error) {
      console.error('Gemini API Error:', error);
      throw error;
    }
  }

  async *generateStoryboard(script: string, characters: Character[], artStyle: 'cinematic' | 'anime' | 'comic book'): AsyncGenerator<StoryboardPanel> {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

    // Step 1: Analyze script and generate shot list
    const shotListSchema = {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            shot_type: {
              type: Type.STRING,
              description: "The type of camera shot (e.g., Wide Shot, Close-Up, Establishing Shot)."
            },
            description: {
              type: Type.STRING,
              description: "A brief, present-tense description of the key action or dialogue in this shot."
            },
            visual_prompt: {
              type: Type.STRING,
              description: "A detailed, descriptive prompt for an AI image generator to create this specific panel. Include character actions and setting details."
            }
          },
          required: ["shot_type", "description", "visual_prompt"]
        }
    };
    
    const characterDescriptions = characters.map(c => `- ${c.name}: ${c.description}`).join('\n');
    const shotListPrompt = `
        You are a film director. Analyze the following script and break it down into a list of distinct camera shots for a storyboard.
        
        Here are the characters involved:
        ${characterDescriptions || "No specific characters defined."}

        Here is the script:
        "${script}"

        For each shot, provide a shot_type, a description, and a concise visual_prompt for an AI image generator. When creating the visual_prompt, describe the characters as specified above if they are in the scene.
    `;
    
    const shotListResponse = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: shotListPrompt,
        config: {
          responseMimeType: "application/json",
          responseSchema: shotListSchema,
        },
    });

    const shotList = JSON.parse(shotListResponse.text.trim());
    if (!Array.isArray(shotList) || shotList.length === 0) {
      throw new Error("The AI could not generate a valid shot list from your script. Please try rephrasing it.");
    }
    
    // Step 2: Generate image for each shot
    for (const shot of shotList) {
        const imagePrompt = `${shot.visual_prompt}, ${artStyle} style`;
        
        const imageResponse = await ai.models.generateContent({
            model: 'gemini-2.5-flash-image',
            contents: { parts: [{ text: imagePrompt }] },
        });

        let imagePart = null;
        for (const part of imageResponse.candidates[0].content.parts) {
            if (part.inlineData) {
                imagePart = part;
                break;
            }
        }
        
        const imageUrl = imagePart && imagePart.inlineData 
            ? `data:image/png;base64,${imagePart.inlineData.data}`
            : '';
            
        const newPanel: StoryboardPanel = {
            id: new Date().toISOString() + Math.random(),
            shotType: shot.shot_type,
            description: shot.description,
            imageUrl: imageUrl
        };

        yield newPanel;
    }
  }
}

export const geminiService = new GeminiService();
