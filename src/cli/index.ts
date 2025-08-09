#!/usr/bin/env node

// CLI interface for Media Downloader

import yargs from 'yargs';
import { hideBin } from 'yargs/helpers';
import { mediaDownloader } from '../core/index.js';
import type { DownloadProgress } from '../core/index.js';
import { getAllExtractors } from '../core/extractors.js';
import { formatBytes, formatSpeed } from '../core/common/index.js';
import * as path from 'path';
import * as fs from 'fs';

// Register all extractors
getAllExtractors().forEach(extractor => {
  mediaDownloader.registerExtractor(extractor);
});

// Progress display utilities

function createProgressBar(progress: number, width: number = 30): string {
  const filled = Math.round((progress / 100) * width);
  const empty = width - filled;
  return '█'.repeat(filled) + '░'.repeat(empty);
}

function displayProgress(progress: DownloadProgress): void {
  const progressBar = createProgressBar(progress.progress);
  const downloaded = formatBytes(progress.downloadedBytes);
  const total = progress.totalBytes > 0 ? formatBytes(progress.totalBytes) : 'Unknown';
  const speed = progress.speed > 0 ? formatSpeed(progress.speed) : '0 B/s';
  
  process.stdout.write(
    `\r${progressBar} ${progress.progress.toFixed(1)}% | ${downloaded}/${total} | ${speed}`
  );
}

// CLI Commands
const argv = yargs(hideBin(process.argv))
  .scriptName('mdu')
  .usage('$0 <command> [options]')
  .command(
    'download <url>',
    'Download media from URL',
    (yargs) => {
      return yargs
        .positional('url', {
          describe: 'URL to download',
          type: 'string',
          demandOption: true
        })
        .option('output', {
          alias: 'o',
          describe: 'Output directory',
          type: 'string',
          default: './downloads'
        })
        .option('format', {
          alias: 'f',
          describe: 'Preferred format',
          type: 'string'
        })
        .option('quality', {
          alias: 'q',
          describe: 'Preferred quality',
          type: 'string',
          choices: ['2160p', '1440p', '1080p', '720p', '480p', '360p', '240p', 'audio']
        })
        .option('format', {
          alias: 'f',
          type: 'string',
          choices: ['mp4', 'mp3', 'wav', 'aac', 'm4a'],
          description: 'Output format (mp4 for video, mp3/wav/aac/m4a for audio)'
        })
        .option('audio-quality', {
          type: 'string',
          choices: ['low', 'medium', 'high'],
          default: 'medium',
          description: 'Audio quality for audio formats'
        });
    },
    async (argv) => {
      try {
        console.log(`🔍 Extracting information from: ${argv.url}`);
        
        // Ensure output directory exists
        const outputPath = path.resolve(argv.output);
        if (!fs.existsSync(outputPath)) {
          fs.mkdirSync(outputPath, { recursive: true });
          console.log(`📁 Created output directory: ${outputPath}`);
        }
        
        // Extract metadata first
        const extractResult = await mediaDownloader.extract(argv.url);
        console.log(`📺 Title: ${extractResult.title}`);
        console.log(`🎬 Available streams: ${extractResult.streams.length}`);
        
        // Display available streams
        console.log('\n📋 Available formats:');
        extractResult.streams.forEach((stream, index) => {
          const size = stream.fileSize ? ` (${formatBytes(stream.fileSize)})` : '';
          console.log(`  ${index + 1}. ${stream.format} - ${stream.quality}${size}`);
        });
        
        console.log('\n⬇️  Starting download...');
        
        // Start download with progress tracking
        const filePath = await mediaDownloader.download(argv.url, {
          outputPath,
          format: argv.format as 'mp4' | 'mp3' | 'wav' | 'aac' | 'm4a' | undefined,
          quality: argv.quality,
          audioQuality: argv['audio-quality'] as 'low' | 'medium' | 'high',
          onProgress: (progress) => {
            if (progress.status === 'downloading') {
              displayProgress(progress);
            } else if (progress.status === 'completed') {
              console.log('\n✅ Download completed!');
            } else if (progress.status === 'error') {
              console.log(`\n❌ Download failed: ${progress.error}`);
            }
          },
          onAudioConversion: (progress: number) => {
            process.stdout.write(`\r🎵 Converting to audio: ${progress}%`);
            if (progress === 100) {
              console.log('\n✅ Audio conversion completed!');
            }
          }
        });
        
        console.log(`💾 File saved to: ${filePath}`);
        
      } catch (error) {
        console.error('❌ Error:', error instanceof Error ? error.message : 'Unknown error');
        process.exit(1);
      }
    }
  )
  .command(
    'info <url>',
    'Get information about media without downloading',
    (yargs) => {
      return yargs
        .positional('url', {
          describe: 'URL to analyze',
          type: 'string',
          demandOption: true
        });
    },
    async (argv) => {
      try {
        console.log(`🔍 Extracting information from: ${argv.url}`);
        
        const extractResult = await mediaDownloader.extract(argv.url);
        
        console.log('\n📺 Media Information:');
        console.log(`Title: ${extractResult.title}`);
        if (extractResult.description) {
          console.log(`Description: ${extractResult.description}`);
        }
        if (extractResult.duration) {
          const minutes = Math.floor(extractResult.duration / 60);
          const seconds = extractResult.duration % 60;
          console.log(`Duration: ${minutes}:${seconds.toString().padStart(2, '0')}`);
        }
        
        console.log('\n🎬 Available Streams:');
        extractResult.streams.forEach((stream, index) => {
          const size = stream.fileSize ? ` (${formatBytes(stream.fileSize)})` : '';
          const codec = stream.codec ? ` [${stream.codec}]` : '';
          console.log(`  ${index + 1}. ${stream.format} - ${stream.quality}${size}${codec}`);
        });
        
        if (extractResult.subtitles && extractResult.subtitles.length > 0) {
          console.log('\n📝 Available Subtitles:');
          extractResult.subtitles.forEach((subtitle, index) => {
            console.log(`  ${index + 1}. ${subtitle.language} (${subtitle.format})`);
          });
        }
        
      } catch (error) {
        console.error('❌ Error:', error instanceof Error ? error.message : 'Unknown error');
        process.exit(1);
      }
    }
  )
  .command(
    'list-extractors',
    'List all available extractors',
    {},
    () => {
      console.log('🔧 Available Extractors:');
      getAllExtractors().forEach((extractor, index) => {
        console.log(`  ${index + 1}. ${extractor.name}`);
      });
    }
  )
  .demandCommand(1, 'You need to specify a command')
  .help()
  .alias('help', 'h')
  .version('1.0.0')
  .alias('version', 'v')
  .example('$0 download "https://www.youtube.com/watch?v=dQw4w9WgXcQ"', 'Download a YouTube video')
  .example('$0 info "https://example.com/video.mp4"', 'Get info about a direct video file')
  .example('$0 download "https://example.com/video.mp4" -o ./my-downloads -q 720p', 'Download with custom options')
  .wrap(Math.min(120, process.stdout.columns || 80))
  .parseAsync();

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  console.error('❌ Uncaught Exception:', error);
  process.exit(1);
});