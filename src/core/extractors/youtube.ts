import { BaseExtractor } from './base.js';
import type { MediaInfo, StreamInfo, StreamQuality } from '../types.js';
import { userAgentManager, type UserAgentConfig } from '../user-agents/index.js';

export interface YouTubeClientConfig {
  clientName: string;
  clientVersion: string;
  userAgent?: string;
  androidSdkVersion?: number;
  osName?: string;
  osVersion?: string;
  deviceMake?: string;
  deviceModel?: string;
}

export interface YouTubeInnerTubeContext {
  client: YouTubeClientConfig;
}

export interface YouTubePlayerResponse {
  videoDetails?: {
    videoId: string;
    title: string;
    lengthSeconds: string;
    channelId: string;
    shortDescription: string;
    thumbnail: {
      thumbnails: Array<{
        url: string;
        width: number;
        height: number;
      }>;
    };
    author: string;
    viewCount: string;
  };
  streamingData?: {
    formats?: Array<{
      itag: number;
      url: string;
      mimeType: string;
      bitrate: number;
      width?: number;
      height?: number;
      fps?: number;
      qualityLabel?: string;
      quality: string;
      audioQuality?: string;
      audioSampleRate?: string;
      audioChannels?: number;
      contentLength?: string;
    }>;
    adaptiveFormats?: Array<{
      itag: number;
      url: string;
      mimeType: string;
      bitrate: number;
      width?: number;
      height?: number;
      fps?: number;
      qualityLabel?: string;
      quality: string;
      audioQuality?: string;
      audioSampleRate?: string;
      audioChannels?: number;
      contentLength?: string;
    }>;
  };
}

export class YouTubeExtractor extends BaseExtractor {
  readonly name = 'YouTube';
  private static readonly INNERTUBE_CLIENTS: Record<string, YouTubeInnerTubeContext> = {
    web: {
      client: {
        clientName: 'WEB',
        clientVersion: '2.20250312.04.00',
      },
    },
    web_safari: {
      client: {
        clientName: 'WEB',
        clientVersion: '2.20250312.04.00',
        userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/15.5 Safari/605.1.15,gzip(gfe)',
      },
    },
    android: {
      client: {
        clientName: 'ANDROID',
        clientVersion: '20.10.38',
        androidSdkVersion: 30,
        userAgent: 'com.google.android.youtube/20.10.38 (Linux; U; Android 11) gzip',
        osName: 'Android',
        osVersion: '11',
      },
    },
    ios: {
      client: {
        clientName: 'IOS',
        clientVersion: '20.10.4',
        deviceMake: 'Apple',
        deviceModel: 'iPhone16,2',
        userAgent: 'com.google.ios.youtube/20.10.4 (iPhone16,2; U; CPU iOS 18_3_2 like Mac OS X;)',
        osName: 'iPhone',
        osVersion: '18.3.2.22D82',
      },
    },
    mweb: {
      client: {
        clientName: 'MWEB',
        clientVersion: '2.20250311.03.00',
        userAgent: 'Mozilla/5.0 (iPad; CPU OS 16_7_10 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.6 Mobile/15E148 Safari/604.1,gzip(gfe)',
      },
    },
  };

  private static readonly INNERTUBE_API_KEY = process.env.YOUTUBE_API_KEY || 'AIzaSyAO_FJ2SlqU8Q4STEHLGCilw_Y9_11qcW8';
  private static readonly INNERTUBE_HOST = 'www.youtube.com';

  test(url: string): boolean {
    const patterns = [
      /(?:https?:\/\/)?(?:www\.)?youtube\.com\/watch\?v=([a-zA-Z0-9_-]{11})/,
      /(?:https?:\/\/)?(?:www\.)?youtube\.com\/embed\/([a-zA-Z0-9_-]{11})/,
      /(?:https?:\/\/)?youtu\.be\/([a-zA-Z0-9_-]{11})/,
      /(?:https?:\/\/)?(?:www\.)?youtube\.com\/v\/([a-zA-Z0-9_-]{11})/,
      /(?:https?:\/\/)?(?:m\.)?youtube\.com\/watch\?v=([a-zA-Z0-9_-]{11})/,
    ];
    
    return patterns.some(pattern => pattern.test(url));
  }

  private extractVideoId(url: string): string | null {
    const patterns = [
      /(?:https?:\/\/)?(?:www\.)?youtube\.com\/watch\?v=([a-zA-Z0-9_-]{11})/,
      /(?:https?:\/\/)?(?:www\.)?youtube\.com\/embed\/([a-zA-Z0-9_-]{11})/,
      /(?:https?:\/\/)?youtu\.be\/([a-zA-Z0-9_-]{11})/,
      /(?:https?:\/\/)?(?:www\.)?youtube\.com\/v\/([a-zA-Z0-9_-]{11})/,
      /(?:https?:\/\/)?(?:m\.)?youtube\.com\/watch\?v=([a-zA-Z0-9_-]{11})/,
    ];
    
    for (const pattern of patterns) {
      const match = url.match(pattern);
      if (match && match[1]) {
        return match[1];
      }
    }
    
    return null;
  }

  private async callInnerTubeAPI(
    endpoint: string,
    videoId: string,
    clientName: string = 'web'
  ): Promise<YouTubePlayerResponse> {
    const client = YouTubeExtractor.INNERTUBE_CLIENTS[clientName];
    if (!client) {
      throw new Error(`Unknown client: ${clientName}`);
    }

    const context = {
      context: {
        client: client.client,
      },
      videoId,
    };

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      'Origin': `https://${YouTubeExtractor.INNERTUBE_HOST}`,
      'Referer': `https://${YouTubeExtractor.INNERTUBE_HOST}/`,
    };

    // Set user agent based on client
    if (client.client.userAgent) {
      headers['User-Agent'] = client.client.userAgent;
    } else {
      headers['User-Agent'] = userAgentManager.getOptimizedUserAgent('youtube').userAgent;
    }

    const url = `https://${YouTubeExtractor.INNERTUBE_HOST}/youtubei/v1/${endpoint}?key=${YouTubeExtractor.INNERTUBE_API_KEY}`;

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers,
        body: JSON.stringify(context),
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      return await response.json() as YouTubePlayerResponse;
    } catch (error) {
      throw new Error(`Failed to call InnerTube API: ${error}`);
    }
  }

  private parseStreamingData(streamingData: YouTubePlayerResponse['streamingData']): StreamInfo[] {
    const streams: StreamInfo[] = [];

    if (!streamingData) {
      return streams;
    }

    // Process regular formats (combined video+audio)
    if (streamingData.formats) {
      for (const format of streamingData.formats) {
        // Skip formats without direct URLs (they require signature decryption)
        if (!format.url) {
          console.warn(`Skipping format ${format.itag}: No direct URL available (signature required)`);
          continue;
        }

        const stream: StreamInfo = {
          url: format.url,
          quality: this.mapQuality(format.qualityLabel || format.quality),
          format: this.extractFormat(format.mimeType),
          fileSize: format.contentLength ? parseInt(format.contentLength) : undefined,
          bitrate: format.bitrate,
          fps: format.fps,
          hasVideo: true,
          hasAudio: true,
          resolution: format.width && format.height ? `${format.width}x${format.height}` : undefined,
          itag: format.itag,
        };

        streams.push(stream);
      }
    }

    // Process adaptive formats (separate video/audio)
    if (streamingData.adaptiveFormats) {
      for (const format of streamingData.adaptiveFormats) {
        // Skip formats without direct URLs (they require signature decryption)
        if (!format.url) {
          console.warn(`Skipping adaptive format ${format.itag}: No direct URL available (signature required)`);
          continue;
        }

        const isVideo = format.mimeType.startsWith('video/');
        const isAudio = format.mimeType.startsWith('audio/');

        const stream: StreamInfo = {
          url: format.url,
          quality: this.mapQuality(format.qualityLabel || format.quality),
          format: this.extractFormat(format.mimeType),
          fileSize: format.contentLength ? parseInt(format.contentLength) : undefined,
          bitrate: format.bitrate,
          fps: format.fps,
          hasVideo: isVideo,
          hasAudio: isAudio,
          resolution: format.width && format.height ? `${format.width}x${format.height}` : undefined,
          itag: format.itag,
          audioQuality: format.audioQuality,
          audioSampleRate: format.audioSampleRate,
          audioChannels: format.audioChannels,
        };

        streams.push(stream);
      }
    }

    return streams;
  }

  private mapQuality(qualityLabel: string): StreamQuality {
    const label = qualityLabel.toLowerCase();
    
    if (label.includes('2160') || label.includes('4k')) return '2160p';
    if (label.includes('1440') || label.includes('2k')) return '1440p';
    if (label.includes('1080')) return '1080p';
    if (label.includes('720')) return '720p';
    if (label.includes('480')) return '480p';
    if (label.includes('360')) return '360p';
    if (label.includes('240')) return '240p';
    if (label.includes('144')) return '144p';
    
    // Audio quality mapping
    if (label.includes('high')) return 'high';
    if (label.includes('medium')) return 'medium';
    if (label.includes('low')) return 'low';
    
    return 'unknown';
  }

  private extractFormat(mimeType: string): string {
    const match = mimeType.match(/\/(\w+)/);
    return match && match[1] ? match[1] : 'unknown';
  }

  async extract(url: string): Promise<MediaInfo> {
    const videoId = this.extractVideoId(url);
    if (!videoId) {
      throw new Error('Invalid YouTube URL: Could not extract video ID');
    }

    // Try different clients in order of preference
    const clientOrder = ['web', 'android', 'ios', 'mweb'];
    let lastError: Error | null = null;

    for (const clientName of clientOrder) {
      try {
        const playerResponse = await this.callInnerTubeAPI('player', videoId, clientName);
        
        if (!playerResponse.videoDetails) {
          throw new Error('No video details found in response');
        }

        const videoDetails = playerResponse.videoDetails;
        const streams = this.parseStreamingData(playerResponse.streamingData);

        if (streams.length === 0) {
          throw new Error('No streams found');
        }

        return {
          id: videoId,
          title: videoDetails.title,
          description: videoDetails.shortDescription || '',
          duration: parseInt(videoDetails.lengthSeconds) || 0,
          uploader: videoDetails.author,
          uploaderUrl: `https://www.youtube.com/channel/${videoDetails.channelId}`,
          viewCount: parseInt(videoDetails.viewCount) || 0,
          thumbnail: videoDetails.thumbnail?.thumbnails?.[0]?.url || '',
          originalUrl: url,
          extractorKey: 'youtube',
          streams,
        };
      } catch (error) {
        lastError = error as Error;
        console.warn(`Failed to extract with client ${clientName}:`, error);
        continue;
      }
    }

    throw new Error(`Failed to extract video with all clients. Last error: ${lastError?.message}`);
  }

  /**
   * Extract video info using a specific client
   */
  async extractWithClient(url: string, clientName: string): Promise<MediaInfo> {
    const videoId = this.extractVideoId(url);
    if (!videoId) {
      throw new Error('Invalid YouTube URL: Could not extract video ID');
    }

    const playerResponse = await this.callInnerTubeAPI('player', videoId, clientName);
    
    if (!playerResponse.videoDetails) {
      throw new Error('No video details found in response');
    }

    const videoDetails = playerResponse.videoDetails;
    const streams = this.parseStreamingData(playerResponse.streamingData);

    return {
      id: videoId,
      title: videoDetails.title,
      description: videoDetails.shortDescription || '',
      duration: parseInt(videoDetails.lengthSeconds) || 0,
      uploader: videoDetails.author,
      uploaderUrl: `https://www.youtube.com/channel/${videoDetails.channelId}`,
      viewCount: parseInt(videoDetails.viewCount) || 0,
      thumbnail: videoDetails.thumbnail?.thumbnails?.[0]?.url || '',
      originalUrl: url,
      extractorKey: 'youtube',
      streams,
    };
  }

  /**
   * Get available clients
   */
  getAvailableClients(): string[] {
    return Object.keys(YouTubeExtractor.INNERTUBE_CLIENTS);
  }
}