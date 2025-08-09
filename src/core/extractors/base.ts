import type { MediaInfo } from '../types.js';
import { userAgentManager } from '../user-agents/index.js';

/**
 * Base class for all media extractors
 * Provides common interface and functionality for extracting media information
 */
export abstract class BaseExtractor {
  /**
   * The name of this extractor
   */
  abstract readonly name: string;

  /**
   * Test if this extractor can handle the given URL
   * @param url The URL to test
   * @returns true if this extractor can handle the URL
   */
  abstract test(url: string): boolean;

  /**
   * Extract media information from the given URL
   * @param url The URL to extract from
   * @returns Promise that resolves to MediaInfo
   */
  abstract extract(url: string): Promise<MediaInfo>;

  /**
   * Get the name of this extractor
   * @returns The extractor name
   */
  getName(): string {
    return this.constructor.name;
  }

  /**
   * Get supported URL patterns for this extractor
   * @returns Array of regex patterns or string patterns
   */
  getSupportedPatterns(): (RegExp | string)[] {
    return [];
  }

  /**
   * Validate URL format
   * @param url The URL to validate
   * @returns true if URL is valid
   */
  protected isValidUrl(url: string): boolean {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Normalize URL by adding protocol if missing
   * @param url The URL to normalize
   * @returns Normalized URL
   */
  protected normalizeUrl(url: string): string {
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      return `https://${url}`;
    }
    return url;
  }

  /**
   * Extract domain from URL
   * @param url The URL to extract domain from
   * @returns Domain name or null if invalid
   */
  protected extractDomain(url: string): string | null {
    try {
      const urlObj = new URL(this.normalizeUrl(url));
      return urlObj.hostname;
    } catch {
      return null;
    }
  }

  /**
   * Sleep for specified milliseconds
   * @param ms Milliseconds to sleep
   */
  protected sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Retry a function with exponential backoff
   * @param fn Function to retry
   * @param maxRetries Maximum number of retries
   * @param baseDelay Base delay in milliseconds
   * @returns Promise that resolves to the function result
   */
  protected async retry<T>(
    fn: () => Promise<T>,
    maxRetries: number = 3,
    baseDelay: number = 1000
  ): Promise<T> {
    let lastError: Error;
    
    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        return await fn();
      } catch (error) {
        lastError = error as Error;
        
        if (attempt === maxRetries) {
          break;
        }
        
        const delay = baseDelay * Math.pow(2, attempt);
        await this.sleep(delay);
      }
    }
    
    throw lastError!;
  }

  /**
   * Make HTTP request with common headers and error handling
   * @param url Request URL
   * @param options Fetch options
   * @returns Promise that resolves to Response
   */
  protected async makeRequest(url: string, options: RequestInit = {}): Promise<Response> {
    const defaultHeaders = {
      'User-Agent': userAgentManager.getCurrentUserAgent(),
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
      'Accept-Language': 'en-US,en;q=0.9',
      'Accept-Encoding': 'gzip, deflate, br',
      'DNT': '1',
      'Connection': 'keep-alive',
      'Upgrade-Insecure-Requests': '1',
      'Sec-Fetch-Dest': 'document',
      'Sec-Fetch-Mode': 'navigate',
      'Sec-Fetch-Site': 'none',
      'Cache-Control': 'max-age=0',
    };

    const mergedOptions: RequestInit = {
      ...options,
      headers: {
        ...defaultHeaders,
        ...options.headers,
      },
    };

    const response = await fetch(url, mergedOptions);
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    return response;
  }
}