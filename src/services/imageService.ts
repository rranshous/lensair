import * as fs from 'fs';
import * as path from 'path';

interface ImageDetails {
  width?: number;
  height?: number;
  size: string;
  type: string;
  lastModified: string;
}

/**
 * Load image details from file
 */
export function loadImageDetails(imagePath: string): ImageDetails {
  const stats = fs.statSync(imagePath);
  const extension = path.extname(imagePath).toLowerCase().slice(1);
  
  // Format file size
  const sizeInBytes = stats.size;
  let size = '';
  if (sizeInBytes < 1024) {
    size = `${sizeInBytes} B`;
  } else if (sizeInBytes < 1024 * 1024) {
    size = `${(sizeInBytes / 1024).toFixed(1)} KB`;
  } else {
    size = `${(sizeInBytes / (1024 * 1024)).toFixed(1)} MB`;
  }
  
  // Get file type
  let type;
  switch (extension) {
    case 'jpg':
    case 'jpeg':
      type = 'JPEG Image';
      break;
    case 'png':
      type = 'PNG Image';
      break;
    case 'gif':
      type = 'GIF Image';
      break;
    case 'webp':
      type = 'WebP Image';
      break;
    default:
      type = extension.toUpperCase();
  }
  
  return {
    size,
    type,
    lastModified: stats.mtime.toLocaleString()
  };
}
