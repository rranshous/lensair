import axios from 'axios';
import * as fs from 'fs';

interface PromptResponse {
  prompt: string;
  response: string;
}

interface ModelResult {
  model: string;
  responses: PromptResponse[];
}

const OLLAMA_API_URL = 'http://localhost:11434/api';

// Default prompts to use for image analysis
export const DEFAULT_PROMPTS = [
  "Describe this image in detail, including what you see and any notable elements.",
  "What emotions or mood does this image convey?",
  "Identify any text present in this image.",
  "Are there any watermarks, transparent text or logos visible in this image? Describe their content and position.",
  "Is there nudity present in this image?",
  "What is the main subject of this image?",
  "Describe the lighting and color scheme of this image.",
  "What is the overall composition of this image?",
  "Describe any notable objects or elements in the background of this image.",
  "Is this a high quality image?"
];

/**
 * Get image description using multiple AI models and prompts
 * @param imagePath Path to the image file
 * @param models List of models to use
 * @param prompts List of prompts to send to each model
 * @param onModelComplete Callback when a single model completes
 */
export async function getImageDescription(
  imagePath: string, 
  models: string[], 
  prompts: string[] = DEFAULT_PROMPTS,
  onModelComplete?: (model: string, promptResponses: PromptResponse[]) => void
): Promise<Record<string, PromptResponse[]>> {
  const results: Record<string, PromptResponse[]> = {};
  
  // Process models sequentially instead of in parallel
  for (const model of models) {
    console.log(`Processing model: ${model} (${models.indexOf(model) + 1}/${models.length})`);
    
    try {
      // Process all prompts for this model
      const promptResponses = await generateDescriptionsWithModel(imagePath, model, prompts);
      results[model] = promptResponses;
      
      // Call the callback if provided
      if (onModelComplete) {
        onModelComplete(model, promptResponses);
      }
    } catch (error) {
      const errorMessage = `Failed to analyze with ${model}: ${(error as Error).message}`;
      console.error(`Error with model ${model}:`, error);
      
      // Create error responses for all prompts
      const errorResponses = prompts.map(prompt => ({
        prompt,
        response: errorMessage
      }));
      
      results[model] = errorResponses;
      
      // Call the callback for errors too
      if (onModelComplete) {
        onModelComplete(model, errorResponses);
      }
    }
  }
  
  return results;
}

/**
 * Generate descriptions for a single model using multiple prompts
 */
async function generateDescriptionsWithModel(
  imagePath: string, 
  model: string, 
  prompts: string[]
): Promise<PromptResponse[]> {
  // Read the image as base64
  const imageBuffer = fs.readFileSync(imagePath);
  const base64Image = imageBuffer.toString('base64');
  
  // Process each prompt sequentially
  const responses: PromptResponse[] = [];
  
  for (let i = 0; i < prompts.length; i++) {
    const prompt = prompts[i];
    console.log(`Processing prompt ${i+1}/${prompts.length} for model ${model}: "${prompt.slice(0, 30)}..."`);
    
    try {
      // Create request for this prompt
      const requestData = {
        model: model,
        prompt: prompt,
        stream: false,
        images: [base64Image]
      };
      
      // Make API call to Ollama
      console.log(`Sending request to ${OLLAMA_API_URL}/generate for model ${model}`);
      const response = await axios.post(`${OLLAMA_API_URL}/generate`, requestData, {
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      // Debug the API response structure
      console.log(`Response from model ${model} (prompt ${i+1}/${prompts.length}): Response received`);
      
      let responseText = "No description available";
      if (response.data && typeof response.data === 'object') {
        // The API returns the actual text in the "response" field of the data object
        responseText = response.data.response || responseText;
      }
      
      responses.push({
        prompt: prompt,
        response: responseText
      });
      
      console.log(`Completed prompt ${i+1}/${prompts.length} for model ${model}`);
    } catch (error) {
      console.error(`Error getting response for prompt "${prompt}" with model ${model}:`, error);
      responses.push({
        prompt: prompt,
        response: `Error: ${(error as Error).message || "Unknown error occurred"}`
      });
    }
  }
  
  return responses;
}
