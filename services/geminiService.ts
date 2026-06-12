import { GoogleGenAI, Type } from "@google/genai";
import { AIFormulaResponse } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const SYSTEM_PROMPT_TEMPLATE = `
You are a backend API that generates configuration for a calculator application.
Your task is to convert the user's natural language description into a strict JSON object.

**STRICT OUTPUT RULES:**
1.  **OUTPUT FORMAT:** Return the JSON object enclosed in a markdown code block (e.g., \`\`\`json ... \`\`\`).
2.  **FORMATTING:** The JSON **MUST** be pretty-printed with indentation (2 spaces) and newlines. Do not minify.
3.  **LANGUAGE:** All visible text (title, names, units, explanation) MUST be in **RUSSIAN**.
4.  **ABBREVIATIONS (CRITICAL):**
    *   Variable and Output 'name' fields MUST be very short (max 12 chars).
    *   Use abbreviations: 'Кол-во' instead of 'Количество', 'Дист.' instead of 'Дистанция', 'Шир.' instead of 'Ширина', 'Выс.' instead of 'Высота', 'Темп.', 'Объем', 'Вес'.
5.  **VARIABLES:**
    *   Keep symbols simple (a, b, x, y, w, h).
    *   Infer standard units if possible (kg, m, cm, rub).
6.  **OUTPUTS (RESULTS):**
    *   The user request might require **MULTIPLE** results (e.g., if asked for "Rectangle", return "Area" AND "Perimeter").
    *   Provide an array of 'outputs'. Each has a name, unit, and JS expression.
7.  **EXPRESSION:** Must be valid, executable JavaScript math (e.g., "a * b", "Math.PI * Math.pow(r, 2)").
8.  **EXPLANATION:** A short, helpful guide (2 sentences) on how to use this tool.

**JSON SCHEMA:**
{
  "title": "String (Max 4 words)",
  "variables": [
    {
      "name": "String (Display Name, Max 12 chars, Abbreviated)",
      "symbol": "String (JS variable name)",
      "unit": "String (Optional unit)"
    }
  ],
  "outputs": [
    {
      "name": "String (Label for answer, e.g. 'Площадь')",
      "unit": "String (Unit for answer, e.g. 'm2')",
      "expression": "String (JS Formula, e.g. 'w * h')"
    }
  ],
  "explanation": "String (User guide)"
}
`;

// Robust parser that handles Markdown code blocks and common JSON errors from LLMs
export const cleanAndParseJSON = (text: string): AIFormulaResponse => {
    let cleanText = text.trim();
    
    // Remove Markdown code blocks if present (```json ... ```)
    cleanText = cleanText.replace(/^```json\s*/i, "").replace(/^```\s*/i, "");
    cleanText = cleanText.replace(/\s*```$/, "");
    
    // Attempt to find the first { and last } to strip conversational garbage
    const firstBrace = cleanText.indexOf('{');
    const lastBrace = cleanText.lastIndexOf('}');
    
    if (firstBrace !== -1 && lastBrace !== -1) {
        cleanText = cleanText.substring(firstBrace, lastBrace + 1);
    }

    try {
        const parsed = JSON.parse(cleanText);
        
        // Migration/Sanitization for AI being stubborn with old format
        if (!parsed.outputs && parsed.expression) {
            parsed.outputs = [{
                name: parsed.resultName || "Result",
                unit: parsed.resultUnit || "",
                expression: parsed.expression
            }];
        }
        
        return parsed as AIFormulaResponse;
    } catch (e) {
        console.error("JSON Parse Error:", e);
        throw new Error("Failed to parse JSON. Please ensure the AI output is valid.");
    }
};

export const generateFormulaFromDescription = async (description: string): Promise<{ data: AIFormulaResponse, raw: string }> => {
  const model = "gemini-2.5-flash";
  
  const prompt = `${SYSTEM_PROMPT_TEMPLATE}
    
  USER REQUEST: "${description}"
  `;

  try {
    const response = await ai.models.generateContent({
      model: model,
      contents: prompt,
      config: {
        responseMimeType: "text/plain", // We want raw text with code blocks now
      }
    });

    if (response.text) {
      const parsedData = cleanAndParseJSON(response.text);
      return { data: parsedData, raw: response.text };
    }
    throw new Error("No response from AI");
  } catch (error) {
    console.error("Error generating formula:", error);
    throw error;
  }
};