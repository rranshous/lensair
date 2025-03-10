import { BrowserWindow, ipcMain } from 'electron';
import * as path from 'path';
import * as fs from 'fs';
import { getImageDescription, DEFAULT_PROMPTS } from '../services/aiService';
import { loadImageDetails } from '../services/imageService';

let mainWindow: BrowserWindow | null = null;

export function initializeApp(imagePath: string, models: string[]) {
  // Create the browser window
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false
    }
  });

  // Listen for renderer process being ready
  ipcMain.on('renderer-ready', (event, data) => {
    console.log('Renderer process reports ready:', data);
  });

  // Load the HTML file - Fix path resolution
  const htmlPath = path.join(__dirname, '..', 'ui', 'index.html');
  console.log('Loading HTML from:', htmlPath);
  
  // Ensure the window is ready before sending messages
  mainWindow.loadFile(htmlPath);
  mainWindow.webContents.once('did-finish-load', () => {
    console.log('Window did-finish-load event fired - UI is ready');
    initializeAnalysis(imagePath, models);
  });
  
  // Open DevTools in development
  if (process.env.NODE_ENV === 'development') {
    mainWindow.webContents.openDevTools();
  }

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

/**
 * Initialize the image analysis process after the UI is ready
 */
async function initializeAnalysis(imagePath: string, models: string[]) {
  if (!mainWindow) {
    console.error('Window was closed before analysis could begin');
    return;
  }
  
  try {
    console.log('Starting image analysis initialization');
    const imageDetails = loadImageDetails(imagePath);
    
    console.log('Sending image-loaded event to renderer');
    mainWindow.webContents.send('image-loaded', {
      path: imagePath,
      details: imageDetails
    });
    
    // Start AI analysis
    console.log(`Starting analysis with models: ${models.join(', ')}`);
    console.log(`Using prompts: ${DEFAULT_PROMPTS.map(p => `"${p}"`).join(', ')}`);
    console.log('Models will be processed sequentially (one at a time) to optimize GPU usage');
    
    console.log('Sending analysis-started event to renderer');
    mainWindow.webContents.send('analysis-started', { 
      models, 
      prompts: DEFAULT_PROMPTS,
      serialProcessing: true
    });
    
    // Process images with AI models
    try {
      // Use callbacks for both prompt completion and model completion
      await getImageDescription(
        imagePath, 
        models, 
        DEFAULT_PROMPTS,
        // Prompt completion callback
        (model, prompt, response, promptIndex, totalPrompts) => {
          if (!mainWindow) {
            console.warn('Skipping prompt-complete event as window is closed');
            return;
          }
          
          console.log(`Model ${model} completed prompt ${promptIndex+1}/${totalPrompts}: "${prompt.slice(0, 30)}..."`);
          
          try {
            mainWindow.webContents.send('prompt-complete', { 
              model, 
              prompt, 
              response,
              promptIndex, 
              totalPrompts
            });
          } catch (sendError) {
            console.error('Error sending prompt-complete event:', sendError);
          }
        },
        // Model completion callback
        (model, promptResponses) => {
          if (!mainWindow) {
            console.warn('Skipping model-complete event as window is closed');
            return;
          }
          
          console.log(`Model ${model} complete with ${promptResponses.length} responses`);
          
          try {
            mainWindow.webContents.send('model-complete', { model, promptResponses });
            console.log(`Successfully sent model-complete for ${model}`);
          } catch (sendError) {
            console.error('Error sending model-complete event:', sendError);
          }
        }
      );
      
      // Send final event indicating all models have completed
      console.log('All models completed, sending analysis-all-complete event');
      if (mainWindow) {
        mainWindow.webContents.send('analysis-all-complete');
      }
    } catch (error) {
      console.error("Error during image analysis:", error);
      if (mainWindow) {
        mainWindow.webContents.send('analysis-error', { error: (error as Error).message });
      }
    }
  } catch (error) {
    console.error('Error in initializeAnalysis:', error);
  }
}
