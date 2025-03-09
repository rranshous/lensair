import axios from 'axios';
import * as fs from 'fs';
import * as FormData from 'form-data';

interface ModelResponse {
  model: string;
  response: string;
}

const OLLAMA_API_URL = 'http://localhost:11434/api';

/**
 * Get image description using multiple AI models
 */
export async function getImageDescription(imagePath: string, models: string[]): Promise<Record<string, string>> {
  const descriptions: Record<string, string> = {};
  
  for (const model of models) {
    try {
      const description = await generateDescriptionWithModel(imagePath, model);
      descriptions[model] = description;
    } catch (error) {
      console.error(`Error with model ${model}:`, error);
      descriptions[model] = `Failed to analyze with ${model}: ${(error as Error).message}`;
    }
  }
  
  return descriptions;
}

/**
 * Generate description for a single model
 */
async function generateDescriptionWithModel(imagePath: string, model: string): Promise<string> {
  // Read the image as base64
  const imageBuffer = fs.readFileSync(imagePath);
  const base64Image = imageBuffer.toString('base64');
  
  // Create request based on the model
  const requestData = {
    model: model,
    prompt: "Describe this image in detail, including what you see and any notable elements.",
    stream: false,
    images: [base64Image]
  };
  
  // Make API call to Ollama
  const response = await axios.post(`${OLLAMA_API_URL}/generate`, requestData, {
    headers: {
      'Content-Type': 'application/json'
    }
  });
  
  return response.data.response || "No description available";
}
