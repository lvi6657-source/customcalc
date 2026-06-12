export interface Variable {
  id: string;
  name: string; // The display name, e.g., "Distance"
  symbol: string; // The variable used in math, e.g., "d"
  unit?: string; // e.g. "km", "kg"
  defaultValue?: number;
}

export interface FormulaOutput {
  id: string;
  name: string; // e.g. "Area"
  unit: string; // e.g. "m2"
  expression: string; // e.g. "w * h"
}

export interface Formula {
  id: string;
  title: string;
  description: string;
  variables: Variable[];
  outputs: FormulaOutput[]; // Changed from single expression to array
  color: string; // For UI aesthetics
  icon: string; // Icon name
  originalPrompt?: string; // The AI prompt used to generate this formula
  aiJson?: string; // The raw JSON response from AI
  
  // Deprecated fields kept for type safety during migration if needed, though we will migrate immediately
  expression?: string; 
  resultUnit?: string;
  resultName?: string;
}

export type ViewState = 'DASHBOARD' | 'EDITOR' | 'RUNNER';

export interface AIFormulaResponse {
  title: string;
  variables: { name: string; symbol: string; unit?: string }[];
  outputs: { name: string; unit: string; expression: string }[]; // Updated schema
  explanation?: string;
}