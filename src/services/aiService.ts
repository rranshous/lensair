import axios from 'axios';
import * as fs from 'fs';
import * as FormData from 'form-data';

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
  "Identify any text present in this image."
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
  
  // Create an array of promises for all model processing
  const modelPromises = models.map(async (model) => {
    try {
      const promptResponses = await generateDescriptionsWithModel(imagePath, model, prompts);
      results[model] = promptResponses;
      
      // Call the callback if provided
      if (onModelComplete) {
        onModelComplete(model, promptResponses);
      }
      
      return { model, promptResponses, error: null };
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
      
      return { model, promptResponses: errorResponses, error };
    }
  });
  
  // Wait for all promises to settle (note: results already sent via callback)
  await Promise.all(modelPromises);
  
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
  
  for (const prompt of prompts) {
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
      console.log(`Response from model ${model}:`, JSON.stringify(response.data).slice(0, 200) + '...');
      
      let responseText = "No description available";
      if (response.data && typeof response.data === 'object') {
        // The API returns the actual text in the "response" field of the data object
        responseText = response.data.response || responseText;
      }
      
      responses.push({
        prompt: prompt,
        response: responseText
      });
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
