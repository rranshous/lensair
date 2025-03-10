import { app, BrowserWindow } from 'electron';
import { Command } from 'commander';
import * as path from 'path';
import * as fs from 'fs';
import { initializeApp } from './ui/app';

// Handle running as a Snap package
if (process.env.SNAP) {
  // Adjust paths as needed for Snap environment
  process.env.OLLAMA_API_URL = process.env.OLLAMA_API_URL || 'http://localhost:11434/api';
}

// Parse command line arguments
const program = new Command();
program
  .name('lensair')
  .description('AI-powered image viewer')
  .version('1.0.0')
  .argument('<imagePath>', 'Path to the image file')
  .option('-m, --models <models>', 'AI models to use for analysis (comma-separated)', 'moondream,llava-phi3,llava,minicpm-v,llama3.2-vision')
  .parse(process.argv);

const options = program.opts();
const [imagePath] = program.args;

// Validate image path
if (!fs.existsSync(imagePath)) {
  console.error(`Error: Image file not found at ${imagePath}`);
  process.exit(1);
}

// Extract models to use
const models = options.models.split(',').map((model: string) => model.trim());

// Start the electron app
app.on('ready', () => {
  initializeApp(imagePath, models);
});

app.on('window-all-closed', () => {
  app.quit();
});
