/**
 * Connection management module exports
 * 
 * This file provides a single import point for all connection-related components.
 */

// Export the ConnectionManager and related components
export { ConnectionManager } from './ConnectionManager';
export { ConnectionManagerProvider, useConnectionManager } from './ConnectionManagerProvider';
export { ConnectionManagerWrapper } from './ConnectionManagerWrapper';
export { RouteChangeDetector } from './RouteChangeDetector';

// Export the connection controllers
export { SSEConnectionController } from './SSEConnectionController';
export { WebSocketConnectionController } from './WebSocketConnectionController';

// Export types
export type { 
  ConnectionManagerConfig,
  ConnectionManagerState,
  ConnectionController,
  ConnectionEventType,
  ConnectionEvent,
  ConnectionHistoryEntry
} from './types';