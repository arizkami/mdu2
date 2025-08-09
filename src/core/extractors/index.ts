import { HttpExtractor } from './http.js';
import { YouTubeExtractor } from './youtube.js';
import { TikTokExtractor } from './tiktok.js';
import { BaseExtractor } from './base.js';
import type { Extractor } from '../index.js';

export { HttpExtractor, YouTubeExtractor, TikTokExtractor };
export type { BaseExtractor };

// Export user agent manager for external use
export { userAgentManager } from '../user-agents/index.js';

export function getAllExtractors(): Extractor[] {
  return [
    new HttpExtractor(),
    new YouTubeExtractor(),
    new TikTokExtractor(),
  ];
}