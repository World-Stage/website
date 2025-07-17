/**
 * Re-export hooks from connection-aware contexts
 * 
 * This file provides a single import point for all connection-related hooks.
 * Components should import from this file instead of directly from the context files.
 */

// Re-export the hooks from the original contexts for backward compatibility
// This ensures that components can continue to use the same hooks
export { useStream } from './StreamContext';
export { useWebSocket } from './WebSocetContext';

// Also export the connection manager hook for advanced usage
export { useConnectionManager } from '../lib/connection/ConnectionManagerProvider';

// Re-export types that might be needed by components
export type { Streamer } from '../lib/connection/SSEConnectionController';
export type { ChatMessage, Encore } from '../lib/connection/types';