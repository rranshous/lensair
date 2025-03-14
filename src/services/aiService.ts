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
  "Identify any text present in this image.",
  "Are there any watermarks, transparent text or logos visible in this image? Describe their content and position.",
  "What is the main subject of this image?",
  "Respond with JSON using the following schema: { peoplePresent: a boolean value. true if there are people detected in the image. false if there are no people detected in the image.; peoplePresentConfidence: a float value. The confidence score of the peple present detection. ;  numberOfPeople: an integer value. The number of people detected in the image.; humanNudityPresent: a boolean value. true if there is human nudity detected in the image. false if there is no human nudity detected in the image.; humanNudityConfidence: a float value. The confidence score of the human nudity detection.; humanFacesPresent: a boolean value. true if there are human faces in the picture. false if there are not human faces in the picture.; humanFacesConfidence: a float value. The confidence score of the human faces detection.; humanFacesCount: an integer value. The number of human faces detected in the image.; humanChildPresent: a boolean value. true if there is a human child present in the image. false if there is not a human child present in the image.; humanChildConfidenceScore: a float value. The confidence of the human child present detection.; humanWomanPresent: a boolean value. true if there is a human woman present in the image. false if there is not a human woman present in the image.; humanWomanConfidence: a float value. The confidence score of the human woman present detection.; humanManPresent: a boolean value. true if there is a human man present in the image. false if there is not a human man present in the image.; humanManConfidence: a float value. The confidence score of the human man present detection.; humanChildPresent: a boolean value. true if there is a human child present in the image. false if there is not a human child present in the image.; humanChildConfidence: a float value. The confidence score of the human child present detection.; humanGroupPresent: a boolean value. true if there is a group of humans present in the image. false if there is not a group of humans present in the image.; humanGroupConfidence: a float value. The confidence score of the human group present detection.; humanGroupCount: an integer value. The number of humans in the group detected in the image.; humanGroupType: a string value. The type of group detected in the image. It can be 'family', 'friends', 'work', 'other'.; humanGroupTypeConfidence: a float value. The confidence score of the human group type detection.; humanGroupTypeCount: an integer value. The number of humans in the group detected in the image.; humanGroupTypeConfidence: a float value. The confidence score of the human group type detection.; humanGroupTypeCount: an integer value. The number of humans in the group detected in the image.; humanGroupTypeConfidence: a float value. The confidence score of the human group type detection.; humanGroupTypeCount: an integer value. The number of humans in the group detected in the image.; humanGroupTypeConfidence: a float value. The confidence score of the human group type detection.; humanGroupTypeCount: an integer value. The number of humans in the group detected in the image.; humanGroupTypeConfidence: a float value. The confidence score of the human group type detection.; humanGroupTypeCount: an integer value. The number of humans in the group detected in the image.; humanGroupTypeConfidence: a float value. The confidence score of the human group type detection.; humanGroupTypeCount: an integer value. The number of humans in the group detected in the image.; humanGroupTypeConfidence: a float value. The confidence score of the human group type detection.; humanGroupTypeCount: an integer value. The number of humans in the group detected in the image.; humanGroupTypeConfidence: a float value. The confidence score of the human group type detection.; humanGroupTypeCount: an integer value. The number of humans in the group detected in the image.; humanGroupTypeConfidence: a float value. The confidence score of the human group type detection.; humanGroupTypeCount: an integer value. The number of humans in the group detected in the image.; humanGroupTypeConfidence: a float value. The confidence score of the human group type detection.; humanGroupTypeCount: an integer value. The number of humans in the group detected in the image.; humanGroupTypeConfidence: a float value. The confidence score of the human group type detection.; humanGroupTypeCount: an integer value. The number of humans in the group detected in the image.; humanGroupTypeConfidence: a float value. The confidence score of the human group type detection.; humanGroupTypeCount: an integer value. The number of humans in the group detected in the image.; humanGroupTypeConfidence: a float value. The confidence score of the human group type detection.; humanGroupTypeCount: an integer value. The number of humans in the group detected in the image.; humanGroupTypeConfidence: a float value. The confidence score of the human group type detection.; humanGroupTypeCount: an integer value. The number of humans in the group detected in the image.; humanGroupTypeConfidence: a float value. The confidence score of the human group type detection.; humanGroupTypeCount: an integer value. The number of humans in the group detected in the image.; humanGroupTypeConfidence: a float value. The confidence score of the human group type detection.; humanGroupTypeCount: an integer value. The number of humans in the group detected in the image.; humanGroupTypeConfidence: a float value. The confidence score of the human group type detection.; humanGroupTypeCount: an integer value. The number of humans in the group detected in the image.; humanGroupTypeConfidence: a float value. The confidence score of the human group type detection.; humanGroupTypeCount: an integer value. The number of humans in the group detected in the image.; humanGroupTypeConfidence: a float value. The confidence score of the human group type detection.; humanGroupTypeCount: an integer value. The number of humans in the group detected in the image.; humanGroupTypeConfidence: a float value. The confidence score of the human group type detection.; nakedHumanWomanPresent: a boolean value. true if there is a naked human woman present in the image. false if there is not a naked human woman present in the image.; nakedHumanWomanConfidence: a float value. The confidence score of the naked human woman present detection.; nakedHumanManPresent: a boolean value. true if there is a naked human man present in the image. false if there is not a naked human man present in the image.; nakedHumanManConfidence: a float value. The confidence score of the naked human man present detection.; }"
];

/**
 * Get image description using multiple AI models and prompts
 * @param imagePath Path to the image file
 * @param models List of models to use
 * @param prompts List of prompts to send to each model
 * @param onPromptComplete Callback when a single prompt completes
 * @param onModelComplete Callback when all prompts for a model complete
 */
export async function getImageDescription(
  imagePath: string, 
  models: string[], 
  prompts: string[] = DEFAULT_PROMPTS,
  onPromptComplete?: (model: string, prompt: string, response: string, promptIndex: number, totalPrompts: number) => void,
  onModelComplete?: (model: string, promptResponses: PromptResponse[]) => void
): Promise<Record<string, PromptResponse[]>> {
  const results: Record<string, PromptResponse[]> = {};
  
  // Process models sequentially instead of in parallel
  for (const model of models) {
    console.log(`Processing model: ${model} (${models.indexOf(model) + 1}/${models.length})`);
    
    try {
      // Process all prompts for this model
      const promptResponses = await generateDescriptionsWithModel(
        imagePath, 
        model, 
        prompts, 
        onPromptComplete
      );
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
  prompts: string[],
  onPromptComplete?: (model: string, prompt: string, response: string, promptIndex: number, totalPrompts: number) => void
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
      
      const promptResponse = {
        prompt: prompt,
        response: responseText
      };
      
      responses.push(promptResponse);
      
      // Call the callback for this single prompt completion if provided
      if (onPromptComplete) {
        onPromptComplete(model, prompt, responseText, i, prompts.length);
      }
      
      console.log(`Completed prompt ${i+1}/${prompts.length} for model ${model}`);
    } catch (error) {
      console.error(`Error getting response for prompt "${prompt}" with model ${model}:`, error);
      const errorResponse = `Error: ${(error as Error).message || "Unknown error occurred"}`;
      
      responses.push({
        prompt: prompt,
        response: errorResponse
      });
      
      // Call the error callback for this prompt
      if (onPromptComplete) {
        onPromptComplete(model, prompt, errorResponse, i, prompts.length);
      }
    }
  }
  
  return responses;
}
