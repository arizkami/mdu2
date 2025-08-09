import ffmpeg from 'fluent-ffmpeg';
import * as path from 'path';
import * as fs from 'fs';
import { fileURLToPath } from 'url';

// Get the path to the bundled ffmpeg binary
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ffmpegPath = path.join(__dirname, '..', '..', '..', 'src', 'shared', 'ffmpeg.exe');
const ffprobePath = path.join(__dirname, '..', '..', '..', 'src', 'shared', 'ffprobe.exe');

// Set ffmpeg binary paths
ffmpeg.setFfmpegPath(ffmpegPath);
ffmpeg.setFfprobePath(ffprobePath);

export interface AudioConversionOptions {
  inputPath: string;
  outputPath: string;
  format: 'mp3' | 'wav' | 'aac' | 'm4a';
  quality?: 'low' | 'medium' | 'high';
  onProgress?: (progress: number) => void;
}

export interface AudioConversionResult {
  success: boolean;
  outputPath?: string;
  error?: string;
  duration?: number;
}

export class AudioProcessor {
  private getQualitySettings(format: string, quality: string = 'medium') {
    const settings: any = {};
    
    switch (format) {
      case 'mp3':
        switch (quality) {
          case 'low':
            settings.audioBitrate = '128k';
            break;
          case 'high':
            settings.audioBitrate = '320k';
            break;
          default:
            settings.audioBitrate = '192k';
        }
        break;
      case 'wav':
        // WAV is lossless, no quality settings needed
        break;
      case 'aac':
      case 'm4a':
        switch (quality) {
          case 'low':
            settings.audioBitrate = '96k';
            break;
          case 'high':
            settings.audioBitrate = '256k';
            break;
          default:
            settings.audioBitrate = '128k';
        }
        break;
    }
    
    return settings;
  }

  async convertToAudio(options: AudioConversionOptions): Promise<AudioConversionResult> {
    return new Promise((resolve) => {
      try {
        // Ensure output directory exists
        const outputDir = path.dirname(options.outputPath);
        if (!fs.existsSync(outputDir)) {
          fs.mkdirSync(outputDir, { recursive: true });
        }

        const qualitySettings = this.getQualitySettings(options.format, options.quality);
        
        let command = ffmpeg(options.inputPath)
          .noVideo() // Remove video stream
          .audioCodec(this.getAudioCodec(options.format));
        
        // Set format based on the target format
        if (options.format === 'aac') {
          command = command.format('adts'); // Use ADTS format for AAC
        } else {
          command = command.format(options.format);
        }

        // Apply quality settings
        if (qualitySettings.audioBitrate) {
          command = command.audioBitrate(qualitySettings.audioBitrate);
        }

        command
          .on('start', (commandLine) => {
            console.log('🎵 Starting audio conversion...');
            console.log('Command:', commandLine);
          })
          .on('progress', (progress) => {
            if (options.onProgress && progress.percent) {
              options.onProgress(Math.round(progress.percent));
            }
          })
          .on('end', () => {
            resolve({
              success: true,
              outputPath: options.outputPath
            });
          })
          .on('error', (err) => {
            resolve({
              success: false,
              error: err.message
            });
          })
          .save(options.outputPath);
      } catch (error) {
        resolve({
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    });
  }

  private getAudioCodec(format: string): string {
    switch (format) {
      case 'mp3':
        return 'libmp3lame';
      case 'wav':
        return 'pcm_s16le';
      case 'aac':
      case 'm4a':
        return 'aac';
      default:
        return 'libmp3lame';
    }
  }

  async extractAudioInfo(filePath: string): Promise<{ duration?: number; format?: string }> {
    return new Promise((resolve) => {
      ffmpeg.ffprobe(filePath, (err, metadata) => {
        if (err) {
          resolve({});
          return;
        }
        
        resolve({
          duration: metadata.format.duration,
          format: metadata.format.format_name
        });
      });
    });
  }

  static isAudioFormat(format: string): boolean {
    const audioFormats = ['mp3', 'wav', 'aac', 'm4a', 'ogg', 'flac'];
    return audioFormats.includes(format.toLowerCase());
  }

  static generateAudioFilename(originalPath: string, targetFormat: string): string {
    const parsed = path.parse(originalPath);
    return path.join(parsed.dir, `${parsed.name}.${targetFormat}`);
  }
}

export const audioProcessor = new AudioProcessor();