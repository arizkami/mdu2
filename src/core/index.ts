// Core types and interfaces for the Media Downloader

import { httpClient } from './http/index.js';
import { generateId, sanitizeFilename } from './common/index.js';
import { audioProcessor, AudioProcessor } from './audio/index.js';
import type { AudioConversionOptions, AudioConversionResult } from './audio/index.js';

export interface StreamInfo {
  url: string;
  format: string;
  quality: string;
  fileSize?: number;
  codec?: string;
  headers?: Record<string, string>;
}

export interface SubtitleInfo {
  url: string;
  language: string;
  format: string;
}

export interface ExtractResult {
  title: string;
  description?: string;
  duration?: number;
  thumbnail?: string;
  streams: StreamInfo[];
  subtitles?: SubtitleInfo[];
  originalUrl: string;
}

export interface DownloadProgress {
  downloadId: string;
  url: string;
  title: string;
  progress: number; // 0-100
  downloadedBytes: number;
  totalBytes: number;
  speed: number; // bytes per second
  status: 'pending' | 'downloading' | 'completed' | 'error' | 'paused';
  error?: string;
}

export interface DownloadOptions {
  outputPath: string;
  format?: 'mp4' | 'mp3' | 'wav' | 'aac' | 'm4a';
  quality?: string;
  audioQuality?: 'low' | 'medium' | 'high';
  onProgress?: (progress: DownloadProgress) => void;
  onAudioConversion?: (progress: number) => void;
}

// Base extractor interface
export interface Extractor {
  name: string;
  test(url: string): boolean;
  extract(url: string): Promise<ExtractResult>;
}

// Core downloader class
export class MediaDownloader {
  private extractors: Extractor[] = [];
  private activeDownloads = new Map<string, DownloadProgress>();

  registerExtractor(extractor: Extractor): void {
    this.extractors.push(extractor);
  }

  private findExtractor(url: string): Extractor | null {
    return this.extractors.find(extractor => extractor.test(url)) || null;
  }

  async extract(url: string): Promise<ExtractResult> {
    const extractor = this.findExtractor(url);
    if (!extractor) {
      throw new Error(`No extractor found for URL: ${url}`);
    }
    return await extractor.extract(url);
  }

  async download(url: string, options: DownloadOptions): Promise<string> {
    const downloadId = generateId();
    
    try {
      const extractResult = await this.extract(url);
      
      // Initialize progress
      const progress: DownloadProgress = {
        downloadId,
        url,
        title: extractResult.title,
        progress: 0,
        downloadedBytes: 0,
        totalBytes: 0,
        speed: 0,
        status: 'pending'
      };
      
      this.activeDownloads.set(downloadId, progress);
      options.onProgress?.(progress);
      
      // Select best stream based on options
      const selectedStream = this.selectBestStream(extractResult.streams, options);
      if (!selectedStream) {
        throw new Error('No suitable stream found');
      }
      
      // Start download
      progress.status = 'downloading';
      options.onProgress?.(progress);
      
      const filename = this.generateFilename(extractResult.title, selectedStream.format);
      const filePath = `${options.outputPath}/${filename}`;
      
      // Use httpClient for actual download
       await httpClient.downloadFile(
         selectedStream.url,
         filePath,
         progress,
         {
           onProgress: (progressData: DownloadProgress) => {
             options.onProgress?.(progressData);
           },
           headers: selectedStream.headers
         }
       );
      
      // Check if audio conversion is needed
      if (options.format && AudioProcessor.isAudioFormat(options.format)) {
        const audioPath = AudioProcessor.generateAudioFilename(filePath, options.format);
        
        const conversionResult = await audioProcessor.convertToAudio({
          inputPath: filePath,
          outputPath: audioPath,
          format: options.format as 'mp3' | 'wav' | 'aac' | 'm4a',
          quality: options.audioQuality,
          onProgress: options.onAudioConversion
        });
        
        if (conversionResult.success && conversionResult.outputPath) {
          // Remove original file after successful conversion
          try {
            await import('fs').then(fs => fs.promises.unlink(filePath));
          } catch (e) {
            // Ignore cleanup errors
          }
          
          progress.status = 'completed';
          progress.progress = 100;
          options.onProgress?.(progress);
          
          this.activeDownloads.delete(downloadId);
          return conversionResult.outputPath;
        } else {
          throw new Error(`Audio conversion failed: ${conversionResult.error}`);
        }
      }
      
      progress.status = 'completed';
      progress.progress = 100;
      options.onProgress?.(progress);
      
      this.activeDownloads.delete(downloadId);
      return filePath;
      
    } catch (error) {
      const progress = this.activeDownloads.get(downloadId);
      if (progress) {
        progress.status = 'error';
        progress.error = error instanceof Error ? error.message : 'Unknown error';
        options.onProgress?.(progress);
      }
      throw error;
    }
  }

  private generateDownloadId(): string {
    return `download_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private generateFilename(title: string, format: string): string {
    const sanitizedTitle = sanitizeFilename(title);
    return `${sanitizedTitle}.${format}`;
  }

  private selectBestStream(streams: StreamInfo[], options: DownloadOptions): StreamInfo | null {
    // Simple selection logic - can be enhanced
    if (options.quality) {
      const qualityMatch = streams.find(s => s.quality === options.quality);
      if (qualityMatch) return qualityMatch;
    }
    
    if (options.format) {
      const formatMatch = streams.find(s => s.format === options.format);
      if (formatMatch) return formatMatch;
    }
    
    // Default to highest quality
    return streams.sort((a, b) => {
      const qualityOrder = ['2160p', '1440p', '1080p', '720p', '480p', '360p', '240p'];
      const aIndex = qualityOrder.indexOf(a.quality);
      const bIndex = qualityOrder.indexOf(b.quality);
      return (aIndex === -1 ? 999 : aIndex) - (bIndex === -1 ? 999 : bIndex);
    })[0] || null;
  }

  private async downloadStream(
    stream: StreamInfo, 
    options: DownloadOptions, 
    progress: DownloadProgress
  ): Promise<string> {
    const axios = await import('axios');
    const fs = await import('fs');
    const path = await import('path');
    
    const filename = `${progress.title.replace(/[^a-zA-Z0-9]/g, '_')}.${stream.format}`;
    const filePath = path.join(options.outputPath, filename);
    
    const response = await axios.default({
      method: 'GET',
      url: stream.url,
      responseType: 'stream',
      onDownloadProgress: (progressEvent) => {
        if (progressEvent.total) {
          progress.totalBytes = progressEvent.total;
          progress.downloadedBytes = progressEvent.loaded;
          progress.progress = Math.round((progressEvent.loaded / progressEvent.total) * 100);
          progress.speed = progressEvent.rate || 0;
          options.onProgress?.(progress);
        }
      }
    });
    
    const writer = fs.createWriteStream(filePath);
    response.data.pipe(writer);
    
    return new Promise((resolve, reject) => {
      writer.on('finish', () => resolve(filePath));
      writer.on('error', reject);
    });
  }

  getActiveDownloads(): DownloadProgress[] {
    return Array.from(this.activeDownloads.values());
  }
}

// Export singleton instance
export const mediaDownloader = new MediaDownloader();

// Auto-register all extractors
import { getAllExtractors } from './extractors.js';
getAllExtractors().forEach(extractor => {
  mediaDownloader.registerExtractor(extractor);
});

// Export audio processing functionality
export { AudioProcessor, audioProcessor } from './audio/index.js';
export type { AudioConversionOptions, AudioConversionResult } from './audio/index.js';