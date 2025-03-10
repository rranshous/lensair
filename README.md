# lensair

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

### Option 1: Snap Installation (Recommended for Ubuntu)

```bash
# Install directly from Snap Store
sudo snap install lensair

# Or install from the local snap file
sudo snap install lensair_1.0.0_amd64.snap --dangerous
```

### Option 2: Manual Installation

```bash
# Clone the repository
git clone <repository-url>
cd lensair

# Install dependencies
npm install

# Build the application
npm run build
```

## Usage

### When installed via Snap

```bash
lensair /path/to/your/image.jpg
```

### When installed manually

```bash
npm start -- /path/to/your/image.jpg
```

### Command Line Options

```
Usage: lensair [options] <imagePath>

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
lensair ~/Pictures/vacation.jpg
```

View an image using only a specific model:
```bash
lensair ~/Pictures/vacation.jpg --models llava
```

Use custom models (must be available in Ollama):
```bash
lensair ~/Pictures/vacation.jpg --models bakllava,moondream
```

## Development

For development with hot-reload:
```bash
# Install dependencies
npm install

# Start development mode
npm run start:dev -- /path/to/your/image.jpg
```

### Building a Snap Package

```bash
# Install snapcraft if not already installed
sudo snap install snapcraft --classic

# Build the snap package
npm run dist

# Install the locally built snap
sudo snap install lensair_1.0.0_amd64.snap --dangerous --classic
```

## Implementation Details

- AI models are served via Ollama
- AI models used for description: moondream, llava
- Image descriptions are built using the responses from multiple models
- Application code is written in TypeScript
- Packaged as a Snap for easy installation on Ubuntu and other Linux distributions
