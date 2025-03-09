import { BrowserWindow, ipcMain } from 'electron';
import * as path from 'path';
import * as fs from 'fs';
import { getImageDescription } from '../services/aiService';
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

  // Load the HTML file - Fix path resolution
  const htmlPath = path.join(__dirname, '..', 'ui', 'index.html');
  console.log('Loading HTML from:', htmlPath);
  mainWindow.loadFile(htmlPath);
  
  // Open DevTools in development
  if (process.env.NODE_ENV === 'development') {
    mainWindow.webContents.openDevTools();
  }

  // Send image info once the window is ready
  mainWindow.webContents.on('did-finish-load', async () => {
    const imageDetails = loadImageDetails(imagePath);
    mainWindow?.webContents.send('image-loaded', {
      path: imagePath,
      details: imageDetails
    });
    
    // Start AI analysis
    mainWindow?.webContents.send('analysis-started');
    
    try {
      const description = await getImageDescription(imagePath, models);
      mainWindow?.webContents.send('analysis-complete', description);
    } catch (error) {
      mainWindow?.webContents.send('analysis-error', { error: (error as Error).message });
    }
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}
