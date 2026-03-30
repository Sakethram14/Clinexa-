
import { GoogleGenAI, Type } from "@google/genai";
import { AIAnalysis } from "../types";

// Initialize the Google GenAI client
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const analysisSchema = {
  type: Type.OBJECT,
  properties: {
    briefSummary: {
      type: Type.STRING,
      description: 'A clinical yet humanized summary of the patient narrative.'
    },
    extractedSymptoms: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
      description: 'Medical symptoms identified from user input.'
    },
    possibleCauses: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
      description: 'Potential conditions for clinical context only.'
    },
    redFlags: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
      description: 'Urgent warning signs or complications.'
    },
    riskScore: {
      type: Type.INTEGER,
      description: 'Risk level 0-100.'
    },
    urgency: {
      type: Type.STRING,
      description: 'Low, Medium, High, or Emergency.'
    }
  },
  required: ['briefSummary', 'extractedSymptoms', 'possibleCauses', 'redFlags', 'riskScore', 'urgency']
};

export async function analyzeSymptoms(symptoms: string): Promise<AIAnalysis> {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Perform a clinical intake analysis on the following patient narrative: "${symptoms}"`,
      config: {
        systemInstruction: `You are Clinexa, an expert clinical intake AI. 
        Your task is to parse unstructured patient descriptions into high-fidelity structured clinical reports.
        1. Narrative Synthesis: Create a brief but holistic summary of the patient's state.
        2. Symptom Mapping: Extract specific clinical symptoms.
        3. Risk Stratification: Calculate a risk score (0-100) and assign urgency (Low, Medium, High, Emergency) based on clinical severity markers.
        4. Red Flag Detection: Explicitly list any life-threatening or urgent indicators requiring immediate physician review.
        Maintain a professional, safe, and empathetic clinical tone.`,
        responseMimeType: "application/json",
        responseSchema: analysisSchema
      }
    });

    const text = response.text;
    if (!text) throw new Error("Diagnostic engine returned empty payload.");

    return JSON.parse(text) as AIAnalysis;
  } catch (error: any) {
    console.error("Clinical Analysis Failed:", error);
    const msg = error?.message || "";
    if (msg.includes("429") || msg.includes("quota")) {
      throw new Error("System High Load: Diagnostic engine quota reached. Please try again in 60 seconds.");
    }
    throw new Error("Connectivity Issue: Failed to synchronize with clinical intelligence units.");
  }
}
