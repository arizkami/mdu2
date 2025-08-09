// HTTP client utilities for downloads

import type { DownloadProgress } from '../index.js';
import { userAgentManager } from '../user-agents/index.js';

export interface DownloadOptions {
  onProgress?: (progress: DownloadProgress) => void;
  headers?: Record<string, string>;
  timeout?: number;
  retries?: number;
}

export class HttpClient {
  private static instance: HttpClient;
  
  static getInstance(): HttpClient {
    if (!HttpClient.instance) {
      HttpClient.instance = new HttpClient();
    }
    return HttpClient.instance;
  }

  async downloadFile(
    url: string,
    outputPath: string,
    progress: DownloadProgress,
    options: DownloadOptions = {}
  ): Promise<string> {
    const axios = await import('axios');
    const fs = await import('fs');
    const path = await import('path');
    
    const { onProgress, headers = {}, timeout = 30000, retries = 3 } = options;
    
    // Add platform-specific headers
    const platformHeaders: Record<string, string> = {};
    
    if (url.includes('tiktok.com')) {
      platformHeaders['Referer'] = 'https://www.tiktok.com/';
      platformHeaders['Origin'] = 'https://www.tiktok.com';
      platformHeaders['Sec-Fetch-Dest'] = 'video';
      platformHeaders['Sec-Fetch-Mode'] = 'cors';
      platformHeaders['Sec-Fetch-Site'] = 'cross-site';
    } else if (url.includes('youtube.com') || url.includes('googlevideo.com')) {
      platformHeaders['Referer'] = 'https://www.youtube.com/';
      platformHeaders['Origin'] = 'https://www.youtube.com';
    }
    
    let attempt = 0;
    
    while (attempt < retries) {
      try {
        const response = await axios.default({
          method: 'GET',
          url,
          responseType: 'stream',
          headers: {
            'User-Agent': userAgentManager.getCurrentUserAgent(),
            'Accept': '*/*',
            'Accept-Language': 'en-US,en;q=0.9',
            'Accept-Encoding': 'gzip, deflate, br',
            'DNT': '1',
            'Connection': 'keep-alive',
            'Upgrade-Insecure-Requests': '1',
            ...platformHeaders,
            ...headers
          },
          timeout,
          onDownloadProgress: (progressEvent) => {
            if (progressEvent.total) {
              progress.totalBytes = progressEvent.total;
              progress.downloadedBytes = progressEvent.loaded;
              progress.progress = Math.round((progressEvent.loaded / progressEvent.total) * 100);
              progress.speed = progressEvent.rate || 0;
              onProgress?.(progress);
            }
          }
        });
        
        // Ensure output directory exists
        const dir = path.dirname(outputPath);
        if (!fs.existsSync(dir)) {
          fs.mkdirSync(dir, { recursive: true });
        }
        
        const writer = fs.createWriteStream(outputPath);
        response.data.pipe(writer);
        
        return new Promise((resolve, reject) => {
          writer.on('finish', () => resolve(outputPath));
          writer.on('error', (error) => {
            // Clean up partial file
            if (fs.existsSync(outputPath)) {
              fs.unlinkSync(outputPath);
            }
            reject(error);
          });
        });
        
      } catch (error) {
        attempt++;
        
        if (attempt >= retries) {
          throw new Error(`Download failed after ${retries} attempts: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
        
        // Wait before retry
        await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
      }
    }
    
    throw new Error('Download failed');
  }

  async head(url: string): Promise<any> {
    const axios = await import('axios');
    
    try {
      return await axios.default.head(url, {
        headers: {
          'User-Agent': userAgentManager.getCurrentUserAgent(),
          'Accept': '*/*',
          'Accept-Language': 'en-US,en;q=0.9',
          'Accept-Encoding': 'gzip, deflate, br',
          'DNT': '1',
          'Connection': 'keep-alive'
        },
        timeout: 10000
      });
    } catch (error) {
      throw new Error(`Failed to get file info: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async getFileInfo(url: string): Promise<{
    contentLength?: number;
    contentType?: string;
    filename?: string;
  }> {
    try {
      const response = await this.head(url);
      
      const contentLength = response.headers['content-length'];
      const contentType = response.headers['content-type'];
      const contentDisposition = response.headers['content-disposition'];
      
      let filename: string | undefined;
      if (contentDisposition) {
        const match = contentDisposition.match(/filename="?([^"]+)"?/);
        if (match) {
          filename = match[1];
        }
      }
      
      return {
        contentLength: contentLength ? parseInt(contentLength) : undefined,
        contentType,
        filename
      };
    } catch (error) {
      throw new Error(`Failed to get file info: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
}

export const httpClient = HttpClient.getInstance();