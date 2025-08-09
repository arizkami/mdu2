import { BaseExtractor } from './base.js';
import type { MediaInfo, StreamInfo, StreamQuality } from '../types.js';
import { userAgentManager, type UserAgentConfig } from '../user-agents/index.js';

export interface TikTokVideoData {
  id: string;
  desc: string;
  createTime: number;
  video: {
    id: string;
    height: number;
    width: number;
    duration: number;
    ratio: string;
    cover: string;
    originCover: string;
    dynamicCover: string;
    playAddr: string;
    downloadAddr: string;
    shareCover: string[];
    reflowCover: string;
    bitrate: number;
    encodedType: string;
    format: string;
    videoQuality: string;
    encodeUserTag: string;
    codecType: string;
    definition: string;
  };
  author: {
    id: string;
    uniqueId: string;
    nickname: string;
    avatarThumb: string;
    avatarMedium: string;
    avatarLarger: string;
    signature: string;
    verified: boolean;
    secUid: string;
    secret: boolean;
    ftc: boolean;
    relation: number;
    openFavorite: boolean;
    commentSetting: number;
    duetSetting: number;
    stitchSetting: number;
    privateAccount: boolean;
  };
  music: {
    id: string;
    title: string;
    playUrl: string;
    coverThumb: string;
    coverMedium: string;
    coverLarge: string;
    authorName: string;
    original: boolean;
    duration: number;
    album: string;
  };
  challenges?: Array<{
    id: string;
    title: string;
    desc: string;
    profileThumb: string;
    profileMedium: string;
    profileLarger: string;
    coverThumb: string;
    coverMedium: string;
    coverLarger: string;
    isCommerce: boolean;
  }>;
  stats: {
    diggCount: number;
    shareCount: number;
    commentCount: number;
    playCount: number;
  };
  duetInfo: {
    duetFromId: string;
  };
  originalItem: boolean;
  officalItem: boolean;
  textExtra: Array<{
    awemeId: string;
    start: number;
    end: number;
    hashtagName: string;
    hashtagId: string;
    type: number;
    userId: string;
    isCommerce: boolean;
    userUniqueId: string;
    secUid: string;
  }>;
  secret: boolean;
  forFriend: boolean;
  digged: boolean;
  itemCommentStatus: number;
  showNotPass: boolean;
  vl1: boolean;
  itemMute: boolean;
  effectStickers: any[];
  authorStats: {
    followingCount: number;
    followerCount: number;
    heartCount: number;
    videoCount: number;
    diggCount: number;
    heart: number;
  };
  privateItem: boolean;
  duetEnabled: boolean;
  stitchEnabled: boolean;
  shareEnabled: boolean;
  isAd: boolean;
  duetDisplay: number;
  stitchDisplay: number;
}

export interface TikTokAPIResponse {
  statusCode: number;
  aweme_details?: TikTokVideoData[];
  itemInfo?: {
    itemStruct: TikTokVideoData;
  };
  shareMeta?: {
    title: string;
    desc: string;
  };
}

export class TikTokExtractor extends BaseExtractor {
  readonly name = 'TikTok';

  private static readonly APP_NAME = 'trill';
  private static readonly APP_VERSION = '34.1.2';
  private static readonly MANIFEST_APP_VERSION = '2023401020';
  private static readonly APP_USER_AGENT = `${TikTokExtractor.APP_NAME}/${TikTokExtractor.APP_VERSION} (Linux; U; Android 13; en_US; Pixel 7; Build/TQ2A.230505.002; Cronet/58.0.2991.0)`;
  
  private static readonly API_HOSTNAME = 'api16-normal-c-useast1a.tiktokv.com';
  private static readonly DEVICE_ID = '7318518857994389254';
  private static readonly IID = '7318518734233393174';
  private static readonly WEBPAGE_HOST = 'https://www.tiktok.com/';

  test(url: string): boolean {
    const patterns = [
      /(?:https?:\/\/)?(?:www\.)?tiktok\.com\/@[\w.-]+\/video\/(\d+)/,
      /(?:https?:\/\/)?(?:vm|vt)\.tiktok\.com\/([\w\d]+)/,
      /(?:https?:\/\/)?(?:www\.)?tiktok\.com\/t\/([\w\d]+)/,
      /(?:https?:\/\/)?(?:m\.)?tiktok\.com\/@[\w.-]+\/video\/(\d+)/,
    ];
    
    return patterns.some(pattern => pattern.test(url));
  }

  private async resolveShortUrl(url: string): Promise<string> {
    try {
      const response = await fetch(url, {
        method: 'HEAD',
        redirect: 'manual',
        headers: {
          'User-Agent': userAgentManager.getOptimizedUserAgent('tiktok').userAgent,
        },
      });
      
      const location = response.headers.get('location');
      if (location) {
        return location;
      }
      
      return url;
    } catch (error) {
      console.warn('Failed to resolve short URL:', error);
      return url;
    }
  }

  private extractVideoId(url: string): string | null {
    const patterns = [
      /(?:https?:\/\/)?(?:www\.)?tiktok\.com\/@[\w.-]+\/video\/(\d+)/,
      /(?:https?:\/\/)?(?:vm|vt)\.tiktok\.com\/([\w\d]+)/,
      /(?:https?:\/\/)?(?:www\.)?tiktok\.com\/t\/([\w\d]+)/,
      /(?:https?:\/\/)?(?:m\.)?tiktok\.com\/@[\w.-]+\/video\/(\d+)/,
    ];
    
    for (const pattern of patterns) {
      const match = url.match(pattern);
      if (match && match[1]) {
        return match[1];
      }
    }
    
    return null;
  }

  private generateDeviceId(): string {
    return Math.floor(Math.random() * 9000000000000000000 + 1000000000000000000).toString();
  }

  private generateInstallId(): string {
    return Math.floor(Math.random() * 9000000000000000000 + 1000000000000000000).toString();
  }

  private buildApiUrl(videoId: string): string {
    const timestamp = Math.floor(Date.now() / 1000);
    const params = new URLSearchParams({
      'device_platform': 'android',
      'os': 'android',
      'ssmix': 'a',
      '_rticket': (Date.now()).toString(),
      'cdid': this.generateDeviceId(),
      'channel': 'googleplay',
      'aid': '0',
      'app_name': 'musical_ly',
      'version_code': '350103',
      'version_name': '35.1.3',
      'manifest_version_code': '2023501030',
      'update_version_code': '2023501030',
      'ab_version': '35.1.3',
      'resolution': '1080*2400',
      'dpi': '420',
      'device_type': 'Pixel 7',
      'device_brand': 'Google',
      'language': 'en',
      'os_api': '29',
      'os_version': '13',
      'ac': 'wifi',
      'is_pad': '0',
      'current_region': 'US',
      'app_type': 'normal',
      'sys_region': 'US',
      'last_install_time': (timestamp - Math.floor(Math.random() * (1123200 - 86400) + 86400)).toString(),
      'timezone_name': 'America/New_York',
      'residence': 'US',
      'app_language': 'en',
      'timezone_offset': '-14400',
      'host_abi': 'armeabi-v7a',
      'locale': 'en',
      'ac2': 'wifi5g',
      'uoo': '1',
      'carrier_region': 'US',
      'op_region': 'US',
      'build_number': '35.1.3',
      'region': 'US',
      'ts': timestamp.toString(),
      'iid': TikTokExtractor.IID,
      'device_id': TikTokExtractor.DEVICE_ID,
      'openudid': this.generateDeviceId().substring(0, 16)
    });

    return `https://${TikTokExtractor.API_HOSTNAME}/aweme/v1/multi/aweme/detail/?${params.toString()}`;
  }

  private async callTikTokAPI(videoId: string): Promise<TikTokAPIResponse | null> {
    const apiUrl = this.buildApiUrl(videoId);
    
    // Create POST data as yt-dlp does
    const postData = new URLSearchParams({
      'aweme_ids': `[${videoId}]`,
      'request_source': '0'
    });
    
    // Generate random odin_tt cookie like yt-dlp
    const odinTt = Array.from({length: 160}, () => Math.floor(Math.random() * 16).toString(16)).join('');
    
    const headers = {
      'User-Agent': 'com.zhiliaoapp.musically/2023501030 (Linux; U; Android 13; en_US; Pixel 7; Build/TD1A.220804.031; Cronet/58.0.2991.0)',
      'Accept': 'application/json',
      'Accept-Encoding': 'gzip, deflate',
      'Accept-Language': 'en-US,en;q=0.9',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
      'Host': TikTokExtractor.API_HOSTNAME,
      'Pragma': 'no-cache',
      'Content-Type': 'application/x-www-form-urlencoded',
      'Cookie': `odin_tt=${odinTt}`,
      'X-Argus': '',
      'X-Gorgon': '',
      'X-Khronos': Date.now().toString(),
      'X-Pods': '',
    };

    try {
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers,
        body: postData.toString(),
      });

      if (!response.ok) {
        console.warn(`TikTok API request failed: ${response.status}`);
        return null;
      }

      const text = await response.text();
      if (!text || text.trim() === '') {
        console.warn('Empty response from TikTok API');
        return null;
      }

      try {
        return JSON.parse(text) as TikTokAPIResponse;
      } catch (parseError) {
        console.warn('Failed to parse TikTok API response:', parseError);
        return null;
      }
    } catch (error) {
      console.warn('TikTok API request error:', error);
      return null;
    }
  }

  private generateSessionCookies(): string {
    // Generate session cookies similar to yt-dlp with more realistic values
    const sessionId = Array.from({length: 32}, () => Math.floor(Math.random() * 16).toString(16)).join('');
    const msToken = Array.from({length: 107}, () => Math.floor(Math.random() * 16).toString(16)).join('');
    const odinTt = Array.from({length: 160}, () => Math.floor(Math.random() * 16).toString(16)).join('');
    const ttwid = Array.from({length: 40}, () => Math.floor(Math.random() * 16).toString(16)).join('');
    const webid = Array.from({length: 19}, () => Math.floor(Math.random() * 10)).join('');
    
    return [
      `sessionid=${sessionId}`,
      `msToken=${msToken}`,
      `odin_tt=${odinTt}`,
      `ttwid=${ttwid}`,
      `webid=${webid}`,
      'tt_csrf_token=v2',
      'tt_chain_token=v2',
      'passport_csrf_token=v2',
      'passport_csrf_token_default=v2'
    ].join('; ');
  }
  
  private getBrowserHeaders(url: string): Record<string, string> {
    return {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7',
      'Accept-Language': 'en-US,en;q=0.9',
      'Accept-Encoding': 'gzip, deflate, br',
      'Cache-Control': 'no-cache',
      'Pragma': 'no-cache',
      'Sec-Ch-Ua': '"Not_A Brand";v="8", "Chromium";v="120", "Google Chrome";v="120"',
      'Sec-Ch-Ua-Mobile': '?0',
      'Sec-Ch-Ua-Platform': '"Windows"',
      'Sec-Fetch-Dest': 'document',
      'Sec-Fetch-Mode': 'navigate',
      'Sec-Fetch-Site': 'none',
      'Sec-Fetch-User': '?1',
      'Upgrade-Insecure-Requests': '1',
      'Cookie': this.generateSessionCookies(),
    };
  }

  private async extractFromWebpage(url: string): Promise<TikTokVideoData | null> {
    try {
      // Add delay to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 2000));
      
      const response = await fetch(url, {
        headers: this.getBrowserHeaders(url),
      });

      if (!response.ok) {
        console.warn(`Failed to fetch webpage: ${response.status} ${response.statusText}`);
        return null;
      }

      const html = await response.text();
      console.log('HTML length:', html.length);
      
      // Try multiple extraction methods
      
      // Method 1: Extract from __UNIVERSAL_DATA_FOR_REHYDRATION__
      const universalMatch = html.match(/<script[^>]*id="__UNIVERSAL_DATA_FOR_REHYDRATION__"[^>]*>([^<]+)<\/script>/);
      if (universalMatch && universalMatch[1]) {
        try {
          const jsonData = JSON.parse(universalMatch[1]);
          console.log('Found UNIVERSAL_DATA_FOR_REHYDRATION');
          console.log('Keys in jsonData:', Object.keys(jsonData));
          
          // Try different paths
          let videoData = jsonData?.['__DEFAULT_SCOPE__']?.['webapp.video-detail']?.['itemInfo']?.['itemStruct'];
          if (!videoData) {
            videoData = jsonData?.['__DEFAULT_SCOPE__']?.['webapp.video-detail']?.['itemStruct'];
          }
          if (!videoData) {
            videoData = jsonData?.['__DEFAULT_SCOPE__']?.['itemInfo']?.['itemStruct'];
          }
          if (!videoData) {
             // Log the structure to understand the data
             console.log('DEFAULT_SCOPE keys:', Object.keys(jsonData?.['__DEFAULT_SCOPE__'] || {}));
             const scope = jsonData?.['__DEFAULT_SCOPE__'];
             if (scope) {
               // Check webapp.video-detail specifically
               const videoDetail = scope['webapp.video-detail'];
               if (videoDetail) {
                 console.log('webapp.video-detail content:', videoDetail);
                 if (videoDetail.statusCode) {
                   console.log('Video detail status code:', videoDetail.statusCode);
                   if (videoDetail.statusCode !== 0) {
                     console.warn('Video may not be accessible, status code:', videoDetail.statusCode);
                   }
                 }
               }
               
               for (const [key, value] of Object.entries(scope)) {
                 if (typeof value === 'object' && value !== null) {
                   console.log(`${key} keys:`, Object.keys(value));
                   if ('itemInfo' in value || 'itemStruct' in value) {
                     console.log(`Found potential video data in ${key}`);
                     videoData = value.itemInfo?.itemStruct || value.itemStruct;
                     if (videoData) break;
                   }
                 }
               }
             }
           }
          
          if (videoData) {
            console.log('Successfully extracted from UNIVERSAL_DATA_FOR_REHYDRATION');
            return videoData;
          }
        } catch (error) {
          console.warn('Failed to parse UNIVERSAL_DATA_FOR_REHYDRATION:', error);
        }
      }

      // Method 2: Extract from SIGI_STATE
      const sigiMatch = html.match(/window\['SIGI_STATE'\]\s*=\s*([^;]+);/);
      if (sigiMatch && sigiMatch[1]) {
        try {
          const sigiData = JSON.parse(sigiMatch[1]);
          console.log('Found SIGI_STATE');
          const itemModule = sigiData?.ItemModule;
          if (itemModule) {
            const videoId = Object.keys(itemModule)[0];
            if (videoId && itemModule[videoId]) {
              console.log('Successfully extracted from SIGI_STATE');
              return itemModule[videoId];
            }
          }
        } catch (error) {
          console.warn('Failed to parse SIGI_STATE:', error);
        }
      }
      
      // Method 3: Extract from __NEXT_DATA__
      const nextDataMatch = html.match(/<script[^>]*id="__NEXT_DATA__"[^>]*>([^<]+)<\/script>/);
      if (nextDataMatch && nextDataMatch[1]) {
        try {
          const nextData = JSON.parse(nextDataMatch[1]);
          console.log('Found __NEXT_DATA__');
          const videoData = nextData?.props?.pageProps?.itemInfo?.itemStruct;
          if (videoData) {
            console.log('Successfully extracted from __NEXT_DATA__');
            return videoData;
          }
        } catch (error) {
          console.warn('Failed to parse __NEXT_DATA__:', error);
        }
      }
      
      // Method 4: Look for any script containing video data
      const allScripts = html.match(/<script[^>]*>([^<]*(?:playAddr|downloadAddr)[^<]*)<\/script>/g);
      if (allScripts) {
        console.log(`Found ${allScripts.length} scripts with video data`);
        for (const script of allScripts) {
          const content = script.replace(/<\/?script[^>]*>/g, '');
          try {
            // Try to find JSON objects in the script
            const jsonMatches = content.match(/\{[^{}]*(?:playAddr|downloadAddr)[^{}]*\}/g);
            if (jsonMatches) {
              for (const jsonMatch of jsonMatches) {
                try {
                  const data = JSON.parse(jsonMatch);
                  if (data.playAddr || data.downloadAddr) {
                    console.log('Found video data in script');
                    return data;
                  }
                } catch (e) {
                  // Continue to next match
                }
              }
            }
          } catch (error) {
            // Continue to next script
          }
        }
      }
      
      console.warn('No video data found in any extraction method');

      return null;
    } catch (error) {
      console.warn('Failed to extract from webpage:', error);
      return null;
    }
  }

  private processVideoUrl(url: string): string {
    try {
      const urlObj = new URL(url);
      
      // Add timestamp and signature parameters that TikTok often requires
      const timestamp = Math.floor(Date.now() / 1000);
      urlObj.searchParams.set('_ts', timestamp.toString());
      urlObj.searchParams.set('_sig', this.generateUrlSignature(url, timestamp));
      
      // Add additional parameters that help with CDN access
      urlObj.searchParams.set('br', '1080');
      urlObj.searchParams.set('bt', '824');
      urlObj.searchParams.set('cd', 'origin');
      urlObj.searchParams.set('ch', '0');
      urlObj.searchParams.set('cr', '0');
      urlObj.searchParams.set('cs', '0');
      urlObj.searchParams.set('dr', '1080');
      urlObj.searchParams.set('ds', '3');
      urlObj.searchParams.set('er', '0');
      urlObj.searchParams.set('l', '202312191707340102121681C0A8011A01');
      urlObj.searchParams.set('lr', 'tiktok_m');
      urlObj.searchParams.set('mime_type', 'video_mp4');
      urlObj.searchParams.set('net', '0');
      urlObj.searchParams.set('pl', '0');
      urlObj.searchParams.set('qs', '0');
      urlObj.searchParams.set('rc', '1');
      urlObj.searchParams.set('vl', '0');
      urlObj.searchParams.set('vr', '0');
      
      return urlObj.toString();
    } catch (error) {
      console.warn('Failed to process video URL:', error);
      return url;
    }
  }

  private generateUrlSignature(url: string, timestamp: number): string {
    // Generate a simple signature based on URL and timestamp
    // This is a simplified version - real TikTok signatures are more complex
    const baseString = `${url}${timestamp}`;
    let hash = 0;
    for (let i = 0; i < baseString.length; i++) {
      const char = baseString.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash).toString(16);
  }

  private parseVideoData(videoData: TikTokVideoData, originalUrl: string): StreamInfo[] {
    const streams: StreamInfo[] = [];
    const sessionCookies = this.generateSessionCookies();
    
    // Enhanced headers for video downloads that mimic browser behavior
    const downloadHeaders = {
      'Referer': 'https://www.tiktok.com/',
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      'Accept': '*/*',
      'Accept-Language': 'en-US,en;q=0.9',
      'Accept-Encoding': 'gzip, deflate, br',
      'Origin': 'https://www.tiktok.com',
      'Sec-Ch-Ua': '"Not_A Brand";v="8", "Chromium";v="120", "Google Chrome";v="120"',
      'Sec-Ch-Ua-Mobile': '?0',
      'Sec-Ch-Ua-Platform': '"Windows"',
      'Sec-Fetch-Dest': 'video',
      'Sec-Fetch-Mode': 'cors',
      'Sec-Fetch-Site': 'cross-site',
      'Cookie': sessionCookies,
      'Range': 'bytes=0-',
    };

    if (videoData.video) {
      const video = videoData.video;
      
      // Main video stream
      if (video.playAddr) {
        const processedUrl = this.processVideoUrl(video.playAddr);
        streams.push({
          url: processedUrl,
          quality: this.mapQuality(video.definition || video.videoQuality || 'unknown'),
          format: video.format || 'mp4',
          fileSize: undefined,
          bitrate: video.bitrate,
          fps: undefined,
          hasVideo: true,
          hasAudio: true,
          resolution: `${video.width}x${video.height}`,
          codec: video.codecType,
          headers: downloadHeaders,
        });
      }

      // Download stream (usually higher quality)
      if (video.downloadAddr && video.downloadAddr !== video.playAddr) {
        const processedUrl = this.processVideoUrl(video.downloadAddr);
        streams.push({
          url: processedUrl,
          quality: this.mapQuality(video.definition || video.videoQuality || 'unknown'),
          format: video.format || 'mp4',
          fileSize: undefined,
          bitrate: video.bitrate,
          fps: undefined,
          hasVideo: true,
          hasAudio: true,
          resolution: `${video.width}x${video.height}`,
          codec: video.codecType,
          isDownloadUrl: true,
          headers: downloadHeaders,
        });
      }
    }

    // Audio stream from music
    if (videoData.music && videoData.music.playUrl) {
      streams.push({
        url: videoData.music.playUrl,
        quality: 'medium',
        format: 'm4a',
        fileSize: undefined,
        bitrate: undefined,
        fps: undefined,
        hasVideo: false,
        hasAudio: true,
        resolution: undefined,
        isAudioOnly: true,
        headers: downloadHeaders,
      });
    }

    return streams;
  }

  private mapQuality(quality: string): StreamQuality {
    const q = quality.toLowerCase();
    
    if (q.includes('1080') || q.includes('hd')) return '1080p';
    if (q.includes('720')) return '720p';
    if (q.includes('480')) return '480p';
    if (q.includes('360')) return '360p';
    if (q.includes('240')) return '240p';
    if (q.includes('high')) return 'high';
    if (q.includes('medium') || q.includes('normal')) return 'medium';
    if (q.includes('low')) return 'low';
    
    return 'unknown';
  }

  private async extractFromMobileAPI(videoId: string): Promise<TikTokVideoData | null> {
    try {
      // Try TikTok's mobile web API
      const mobileApiUrl = `https://m.tiktok.com/api/item/detail/?itemId=${videoId}`;
      
      const response = await fetch(mobileApiUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.0 Mobile/15E148 Safari/604.1',
          'Accept': 'application/json, text/plain, */*',
          'Accept-Language': 'en-US,en;q=0.9',
          'Referer': 'https://m.tiktok.com/',
          'Origin': 'https://m.tiktok.com',
        },
      });
      
      if (response.ok) {
        const data = await response.json();
        console.log('Mobile API response:', data);
        return data?.itemInfo?.itemStruct || null;
      }
    } catch (error) {
      console.warn('Mobile API extraction failed:', error);
    }
    return null;
  }

  async extract(url: string): Promise<MediaInfo> {
    // Resolve short URLs first
    let resolvedUrl = url;
    if (url.includes('vm.tiktok.com') || url.includes('vt.tiktok.com') || url.includes('/t/')) {
      resolvedUrl = await this.resolveShortUrl(url);
    }

    const videoId = this.extractVideoId(resolvedUrl);
    if (!videoId) {
      throw new Error('Invalid TikTok URL: Could not extract video ID');
    }

    // Try multiple extraction methods
    let videoData: TikTokVideoData | null = null;
    
    // Method 1: Try mobile API first (often less restricted)
    console.log('Trying mobile API extraction...');
    videoData = await this.extractFromMobileAPI(videoId);
    
    // Method 2: Try webpage extraction
    if (!videoData) {
      console.log('Trying webpage extraction...');
      videoData = await this.extractFromWebpage(resolvedUrl);
    }
    
    // Method 3: Fallback to desktop API
    if (!videoData) {
      console.log('Trying desktop API extraction...');
      const apiResponse = await this.callTikTokAPI(videoId);
      if (apiResponse?.aweme_details?.[0]) {
        videoData = apiResponse.aweme_details[0];
      } else if (apiResponse?.itemInfo?.itemStruct) {
        videoData = apiResponse.itemInfo.itemStruct;
      }
    }

    if (!videoData) {
      throw new Error('Failed to extract video data from all available methods (mobile API, webpage, desktop API)');
    }

    const streams = this.parseVideoData(videoData, resolvedUrl);
    
    if (streams.length === 0) {
      throw new Error('No streams found');
    }

    return {
      id: videoData.id,
      title: videoData.desc || 'TikTok Video',
      description: videoData.desc || '',
      duration: videoData.video?.duration || 0,
      uploader: videoData.author?.nickname || videoData.author?.uniqueId || 'Unknown',
      uploaderUrl: `https://www.tiktok.com/@${videoData.author?.uniqueId}`,
      viewCount: videoData.stats?.playCount || 0,
      thumbnail: videoData.video?.cover || videoData.video?.originCover || '',
      originalUrl: url,
      extractorKey: 'tiktok',
      streams,
      metadata: {
        author: videoData.author,
        music: videoData.music,
        stats: videoData.stats,
        challenges: videoData.challenges,
      },
    };
  }

  /**
   * Extract using only webpage method
   */
  async extractFromWebOnly(url: string): Promise<MediaInfo> {
    const resolvedUrl = url.includes('vm.tiktok.com') || url.includes('vt.tiktok.com') || url.includes('/t/') 
      ? await this.resolveShortUrl(url) 
      : url;

    const videoData = await this.extractFromWebpage(resolvedUrl);
    if (!videoData) {
      throw new Error('Failed to extract video data from webpage');
    }

    const streams = this.parseVideoData(videoData, resolvedUrl);
    
    return {
      id: videoData.id,
      title: videoData.desc || 'TikTok Video',
      description: videoData.desc || '',
      duration: videoData.video?.duration || 0,
      uploader: videoData.author?.nickname || videoData.author?.uniqueId || 'Unknown',
      uploaderUrl: `https://www.tiktok.com/@${videoData.author?.uniqueId}`,
      viewCount: videoData.stats?.playCount || 0,
      thumbnail: videoData.video?.cover || videoData.video?.originCover || '',
      originalUrl: url,
      extractorKey: 'tiktok',
      streams,
      metadata: {
        author: videoData.author,
        music: videoData.music,
        stats: videoData.stats,
        challenges: videoData.challenges,
      },
    };
  }
}