/**
 * Environment Configuration
 * 
 * Centralized configuration for all environment variables.
 * This ensures type safety and provides fallbacks for all URLs.
 */

export interface AppConfig {
  api: {
    baseUrl: string;
    refreshUrl: string;
  };
  websocket: {
    url: string;
  };
  sse: {
    url: string;
  };
  rtmp: {
    url: string;
  };
  environment: string;
}

/**
 * Get the current environment configuration
 */
export function getConfig(): AppConfig {
  const isDevelopment = process.env.NODE_ENV === 'development';

  // Default development URLs
  const defaultApiBase = 'http://localhost:8082';
  const defaultWebSocketUrl = 'http://localhost:8082/ws';
  const defaultSSEUrl = 'http://localhost:8082/streams/view/subscribe';
  const defaultRTMPUrl = 'rtmp://localhost:1935/live';

  // Production URLs
  const productionApiBase = 'https://api.stagio.live';
  const productionWebSocketUrl = 'https://api.stagio.live/ws';
  const productionSSEUrl = 'https://api.stagio.live/streams/view/subscribe';
  const productionRTMPUrl = 'rtmp://rtmp.stagio.live:1935/live';

  return {
    api: {
      baseUrl: process.env.NEXT_PUBLIC_API_BASE_URL ||
        (isDevelopment ? defaultApiBase : productionApiBase),
      refreshUrl: process.env.NEXT_PUBLIC_API_REFRESH_URL ||
        (isDevelopment ? `${defaultApiBase}/auth/refresh` : `${productionApiBase}/auth/refresh`)
    },
    websocket: {
      url: process.env.NEXT_PUBLIC_WEBSOCKET_URL ||
        (isDevelopment ? defaultWebSocketUrl : productionWebSocketUrl)
    },
    sse: {
      url: process.env.NEXT_PUBLIC_SSE_URL ||
        (isDevelopment ? defaultSSEUrl : productionSSEUrl)
    },
    rtmp: {
      url: process.env.NEXT_PUBLIC_RTMP_URL ||
        (isDevelopment ? defaultRTMPUrl : productionRTMPUrl)
    },
    environment: process.env.NODE_ENV || 'development'
  };
}

/**
 * Get a specific configuration value
 */
export function getApiBaseUrl(): string {
  return getConfig().api.baseUrl;
}

export function getWebSocketUrl(): string {
  return getConfig().websocket.url;
}

export function getSSEUrl(): string {
  return getConfig().sse.url;
}

export function getRTMPUrl(): string {
  return getConfig().rtmp.url;
}

export function getApiRefreshUrl(): string {
  return getConfig().api.refreshUrl;
}

/**
 * Check if we're in development mode
 */
export function isDevelopment(): boolean {
  return getConfig().environment === 'development';
}

/**
 * Check if we're in production mode
 */
export function isProduction(): boolean {
  return getConfig().environment === 'production';
}

/**
 * Transform HLS URL based on environment
 * In development, replace nginx-rtmp:8080 with localhost:8080
 * In production, use the URL as-is or apply production-specific transformations
 */
export function transformHlsUrl(hlsUrl: string): string {
  if (!hlsUrl) return hlsUrl;

  if (isDevelopment()) {
    // In development, replace nginx-rtmp:8080 with localhost:8080
    return hlsUrl.replace('http://transcoder-worker', 'http://localhost:3001');
  }

  // In production, return the URL as-is
  // You can add production-specific transformations here if needed
  return hlsUrl;
}