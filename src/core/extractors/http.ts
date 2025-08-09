// HTTP extractor for direct file downloads

import type { Extractor, ExtractResult, StreamInfo } from '../index.js';
import { httpClient } from '../http/index.js';
import { getFileExtension } from '../common/index.js';

export class HttpExtractor implements Extractor {
  name = 'HTTP';

  test(url: string): boolean {
    try {
      const urlObj = new URL(url);
      // Check for common media file extensions
      const mediaExtensions = ['.mp4', '.mp3', '.avi', '.mkv', '.webm', '.m4a', '.wav', '.flac'];
      return mediaExtensions.some(ext => urlObj.pathname.toLowerCase().endsWith(ext));
    } catch {
      return false;
    }
  }

  async extract(url: string): Promise<ExtractResult> {
    try {
      // Get file info via HEAD request
      const fileInfo = await httpClient.getFileInfo(url);
      
      // Extract filename from URL or use provided filename
      const urlPath = new URL(url).pathname;
      const urlFilename = urlPath.split('/').pop() || 'download';
      const filename = fileInfo.filename || urlFilename;
      const extension = getFileExtension(filename);
      
      // Determine quality based on file size (rough estimation)
      const fileSize = fileInfo.contentLength;
      let quality = 'unknown';
      if (fileSize) {
        if (fileSize > 100 * 1024 * 1024) quality = '1080p'; // > 100MB
        else if (fileSize > 50 * 1024 * 1024) quality = '720p'; // > 50MB
        else if (fileSize > 20 * 1024 * 1024) quality = '480p'; // > 20MB
        else quality = '360p';
      }
      
      const stream: StreamInfo = {
        quality,
        format: extension,
        url,
        fileSize
      };
      
      return {
        title: filename.replace(`.${extension}`, ''),
        originalUrl: url,
        streams: [stream],
        subtitles: []
      };
    } catch (error) {
      throw new Error(`Failed to extract HTTP file info: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
}