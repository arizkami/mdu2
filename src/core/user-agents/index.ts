export interface UserAgentConfig {
  name: string;
  userAgent: string;
  platform: string;
  deviceType: 'desktop' | 'mobile' | 'tablet' | 'tv' | 'vr';
  description?: string;
}

export const USER_AGENTS: Record<string, UserAgentConfig> = {
  // Desktop browsers
  chrome_windows: {
    name: 'Chrome Windows',
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
    platform: 'Windows',
    deviceType: 'desktop',
    description: 'Latest Chrome on Windows 10/11'
  },
  chrome_mac: {
    name: 'Chrome macOS',
    userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
    platform: 'macOS',
    deviceType: 'desktop',
    description: 'Latest Chrome on macOS'
  },
  chrome_linux: {
    name: 'Chrome Linux',
    userAgent: 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
    platform: 'Linux',
    deviceType: 'desktop',
    description: 'Latest Chrome on Linux'
  },
  firefox_windows: {
    name: 'Firefox Windows',
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:133.0) Gecko/20100101 Firefox/133.0',
    platform: 'Windows',
    deviceType: 'desktop',
    description: 'Latest Firefox on Windows'
  },
  safari_mac: {
    name: 'Safari macOS',
    userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.2 Safari/605.1.15',
    platform: 'macOS',
    deviceType: 'desktop',
    description: 'Latest Safari on macOS'
  },
  edge_windows: {
    name: 'Edge Windows',
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36 Edg/131.0.0.0',
    platform: 'Windows',
    deviceType: 'desktop',
    description: 'Latest Edge on Windows'
  },

  // Mobile browsers
  chrome_android: {
    name: 'Chrome Android',
    userAgent: 'Mozilla/5.0 (Linux; Android 14; SM-G998B) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Mobile Safari/537.36',
    platform: 'Android',
    deviceType: 'mobile',
    description: 'Chrome on Android (Samsung Galaxy S21)'
  },
  chrome_android_pixel: {
    name: 'Chrome Android Pixel',
    userAgent: 'Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Mobile Safari/537.36',
    platform: 'Android',
    deviceType: 'mobile',
    description: 'Chrome on Android (Google Pixel 8)'
  },
  safari_ios: {
    name: 'Safari iOS',
    userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_2 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.2 Mobile/15E148 Safari/604.1',
    platform: 'iOS',
    deviceType: 'mobile',
    description: 'Safari on iPhone'
  },
  safari_ios_iphone15: {
    name: 'Safari iOS iPhone 15',
    userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_2 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.2 Mobile/22C150 Safari/604.1',
    platform: 'iOS',
    deviceType: 'mobile',
    description: 'Safari on iPhone 15 Pro'
  },

  // Tablet browsers
  safari_ipad: {
    name: 'Safari iPad',
    userAgent: 'Mozilla/5.0 (iPad; CPU OS 18_2 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.2 Mobile/15E148 Safari/604.1',
    platform: 'iPadOS',
    deviceType: 'tablet',
    description: 'Safari on iPad'
  },
  chrome_android_tablet: {
    name: 'Chrome Android Tablet',
    userAgent: 'Mozilla/5.0 (Linux; Android 14; SM-T970) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
    platform: 'Android',
    deviceType: 'tablet',
    description: 'Chrome on Android tablet (Samsung Galaxy Tab S7+)'
  },

  // TV and streaming devices
  tv_chrome: {
    name: 'TV Chrome',
    userAgent: 'Mozilla/5.0 (ChromiumStylePlatform) Cobalt/Version',
    platform: 'TV',
    deviceType: 'tv',
    description: 'Chrome on Smart TV'
  },

  // App user agents (for API calls)
  youtube_android: {
    name: 'YouTube Android App',
    userAgent: 'com.google.android.youtube/20.10.38 (Linux; U; Android 14) gzip',
    platform: 'Android',
    deviceType: 'mobile',
    description: 'YouTube Android app'
  },
  youtube_ios: {
    name: 'YouTube iOS App',
    userAgent: 'com.google.ios.youtube/20.10.4 (iPhone16,2; U; CPU iOS 18_2 like Mac OS X;)',
    platform: 'iOS',
    deviceType: 'mobile',
    description: 'YouTube iOS app'
  },
  tiktok_android: {
    name: 'TikTok Android App',
    userAgent: 'com.ss.android.ugc.trill/34.0.3 (Linux; U; Android 14; en_US; Pixel 8; Build/UQ1A.240205.004; Cronet/119.0.6045.66)',
    platform: 'Android',
    deviceType: 'mobile',
    description: 'TikTok Android app'
  },

  // Bot/crawler user agents
  googlebot: {
    name: 'Googlebot',
    userAgent: 'Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)',
    platform: 'Bot',
    deviceType: 'desktop',
    description: 'Google search bot'
  },
  facebookbot: {
    name: 'Facebook Bot',
    userAgent: 'facebookexternalhit/1.1 (+http://www.facebook.com/externalhit_uatext.php)',
    platform: 'Bot',
    deviceType: 'desktop',
    description: 'Facebook external hit bot'
  },

  // Generic/fallback
  generic: {
    name: 'Generic Browser',
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
    platform: 'Windows',
    deviceType: 'desktop',
    description: 'Generic browser user agent'
  }
};

export class UserAgentManager {
  private static instance: UserAgentManager;
  private currentUserAgent: UserAgentConfig;

  private constructor() {
    this.currentUserAgent = USER_AGENTS.chrome_windows!;
  }

  static getInstance(): UserAgentManager {
    if (!UserAgentManager.instance) {
      UserAgentManager.instance = new UserAgentManager();
    }
    return UserAgentManager.instance;
  }

  /**
   * Get all available user agents
   */
  getAllUserAgents(): Record<string, UserAgentConfig> {
    return USER_AGENTS;
  }

  /**
   * Get user agents by device type
   */
  getUserAgentsByType(deviceType: UserAgentConfig['deviceType']): UserAgentConfig[] {
    return Object.values(USER_AGENTS).filter(ua => ua.deviceType === deviceType);
  }

  /**
   * Get user agents by platform
   */
  getUserAgentsByPlatform(platform: string): UserAgentConfig[] {
    return Object.values(USER_AGENTS).filter(ua => ua.platform.toLowerCase().includes(platform.toLowerCase()));
  }

  /**
   * Set the current user agent
   */
  setUserAgent(key: string): boolean {
    if (USER_AGENTS[key]) {
      this.currentUserAgent = USER_AGENTS[key];
      return true;
    }
    return false;
  }

  /**
   * Set a custom user agent
   */
  setCustomUserAgent(config: UserAgentConfig): void {
    this.currentUserAgent = config;
  }

  /**
   * Get the current user agent string
   */
  getCurrentUserAgent(): string {
    return this.currentUserAgent.userAgent;
  }

  /**
   * Get the current user agent config
   */
  getCurrentConfig(): UserAgentConfig {
    return this.currentUserAgent;
  }

  /**
   * Get a random user agent
   */
  getRandomUserAgent(deviceType?: UserAgentConfig['deviceType']): UserAgentConfig {
    const agents = deviceType 
      ? this.getUserAgentsByType(deviceType)
      : Object.values(USER_AGENTS);
    
    if (agents.length === 0) {
      return USER_AGENTS.chrome_windows!;
    }
    
    const randomIndex = Math.floor(Math.random() * agents.length);
    return agents[randomIndex]!;
  }

  /**
   * Rotate to a random user agent
   */
  rotateUserAgent(deviceType?: UserAgentConfig['deviceType']): UserAgentConfig {
    this.currentUserAgent = this.getRandomUserAgent(deviceType);
    return this.currentUserAgent;
  }

  /**
   * Get user agent optimized for a specific platform
   */
  getOptimizedUserAgent(platform: 'youtube' | 'tiktok' | 'instagram' | 'twitter' | 'generic'): UserAgentConfig {
    const fallback = USER_AGENTS.generic!; // We know generic exists
    switch (platform) {
      case 'youtube':
        return USER_AGENTS.chrome_windows || fallback; // YouTube works best with Chrome, fallback to generic if undefined
      case 'tiktok':
        return USER_AGENTS.chrome_android || fallback; // TikTok often requires mobile UA
      case 'instagram':
        return USER_AGENTS.safari_ios || fallback; // Instagram works well with iOS Safari
      case 'twitter':
        return USER_AGENTS.chrome_windows || fallback;
      default:
        return USER_AGENTS.chrome_windows || fallback;
    }
  }

  /**
   * Generate a random Chrome user agent with version variation
   */
  generateRandomChromeUA(): string {
    const versions = ['130.0.0.0', '131.0.0.0', '132.0.0.0', '133.0.0.0'];
    const randomVersion = versions[Math.floor(Math.random() * versions.length)];
    return `Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/${randomVersion} Safari/537.36`;
  }
}

export const userAgentManager = UserAgentManager.getInstance();