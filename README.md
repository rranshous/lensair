# fUllVIew

This is an image viewer which runs on Ubuntu 24.

The tool is executed from the command line and runs in a native UI. It displays images as well as detailed AI-generated descriptions about the image content.

## Features

- View images in a clean, modern interface
- Get AI-powered descriptions of image content
- Uses multiple models for more comprehensive analysis
- Native desktop application built with Electron

## Prerequisites

### Ollama Setup

This application requires [Ollama](https://ollama.ai/) to be installed and running locally:

1. Install Ollama by following instructions at [https://ollama.ai/](https://ollama.ai/)
2. Start the Ollama server
3. Install the required models:
   ```
   ollama pull moondream
   ollama pull llava
   ```

## Installation

```bash
# Clone the repository
git clone <repository-url>
cd fullview

# Install dependencies
npm install

# Build the application
npm run build
```

## Usage

### Basic Usage

```bash
npm start -- /path/to/your/image.jpg
```

### Command Line Options

```
Usage: fullview [options] <imagePath>

AI-powered image viewer

Arguments:
  imagePath               Path to the image file

Options:
  -V, --version           output the version number
  -m, --models <models>   AI models to use for analysis (comma-separated) (default: "moondream,llava")
  -h, --help              display help for command
```

### Examples

View an image using default models (moondream and llava):
```bash
npm start -- ~/Pictures/vacation.jpg
```

View an image using only a specific model:
```bash
npm start -- ~/Pictures/vacation.jpg --models llava
```

Use custom models (must be available in Ollama):
```bash
npm start -- ~/Pictures/vacation.jpg --models bakllava,moondream
```

## Development

For development with hot-reload:
```bash
# Install dependencies
npm install

# Start development mode
npm run dev -- /path/to/your/image.jpg
```

## Implementation Details

- AI models are served via Ollama
- AI models used for description: moondream, llava
- Image descriptions are built using the responses from multiple models
- Application code is written in TypeScript
