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
 * @param imagePath Path to the image file
 * @param models List of models to use
 * @param onModelComplete Callback when a single model completes
 */
export async function getImageDescription(
  imagePath: string, 
  models: string[], 
  onModelComplete?: (model: string, description: string) => void
): Promise<Record<string, string>> {
  const descriptions: Record<string, string> = {};
  
  // Create an array of promises for all model processing
  const modelPromises = models.map(async (model) => {
    try {
      const description = await generateDescriptionWithModel(imagePath, model);
      descriptions[model] = description;
      
      // Call the callback if provided
      if (onModelComplete) {
        onModelComplete(model, description);
      }
      
      return { model, description, error: null };
    } catch (error) {
      const errorMessage = `Failed to analyze with ${model}: ${(error as Error).message}`;
      console.error(`Error with model ${model}:`, error);
      descriptions[model] = errorMessage;
      
      // Call the callback for errors too
      if (onModelComplete) {
        onModelComplete(model, errorMessage);
      }
      
      return { model, description: errorMessage, error };
    }
  });
  
  // Wait for all promises to settle (note: results already sent via callback)
  await Promise.all(modelPromises);
  
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
