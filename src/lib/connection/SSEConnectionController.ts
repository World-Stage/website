import { BaseConnectionController } from './BaseConnectionController';
import { ConnectionEventType } from './types';

/**
 * Interface for SSE state that will be preserved during disconnection
 */
export interface SSEState {
    hlsUrl: string;
    stream: Stream | null;
    expirationTime: number | null;
    streamId: string;
}

/**
 * Interface for user information
 */
export interface User {
    id: string;
    email: string;
    username: string;
    streamKey: string;
    createdTs: string;
    lastModifiedTs: string;
}

/**
 * Interface for stream information
 */
export interface Stream {
    id: string;
    streamKey: string;
    rtmpUrl: string;
    hlsUrl: string;
    active: boolean;
    title: string;
    description?: string;
    status: string;
    user: User;
    timeRemaining?: number;
}

/**
 * Configuration options for SSEConnectionController
 */
export interface SSEConnectionControllerOptions {
    url: string;
    maxConnectionAttempts?: number;
    baseReconnectDelay?: number;
    debug?: boolean;
    connectionTimeout?: number;
    onConnectionEvent?: (eventType: ConnectionEventType, metadata?: any) => void;
}

/**
 * Error types specific to SSE connections
 */
export enum SSEErrorType {
    CONNECTION_ERROR = 'connection_error',
    EVENT_ERROR = 'event_error',
    NETWORK_ERROR = 'network_error',
    TIMEOUT_ERROR = 'timeout_error',
    UNKNOWN_ERROR = 'unknown_error'
}

/**
 * SSEConnectionController
 * 
 * Controller for managing Server-Sent Events (SSE) connections.
 * Handles connection establishment, termination, and state preservation.
 * Implements reconnection with exponential backoff and error handling.
 */
export class SSEConnectionController extends BaseConnectionController {
    public id: string = 'sse';
    private eventSource: EventSource | null = null;
    private state: SSEState;
    private url: string;
    private connectionTimeout: number;
    private connectionTimer: NodeJS.Timeout | null = null;
    private reconnectTimer: NodeJS.Timeout | null = null;
    private onConnectionEvent?: (eventType: ConnectionEventType, metadata?: any) => void;
    private isReconnecting: boolean = false;
    private lastErrorTime: number = 0;
    private errorCount: number = 0;
    private eventListeners: Map<string, (event: MessageEvent) => void> = new Map();

    /**
     * Creates a new SSEConnectionController
     * 
     * @param options Configuration options
     */
    constructor(options: SSEConnectionControllerOptions) {
        super({
            maxConnectionAttempts: options.maxConnectionAttempts,
            baseReconnectDelay: options.baseReconnectDelay,
            debug: options.debug
        });

        this.url = options.url;
        this.state = {
            hlsUrl: '',
            stream: null,
            expirationTime: null,
            streamId: ''
        };

        // Set connection parameters with defaults
        this.connectionTimeout = options.connectionTimeout ?? 10000; // 10 seconds
        this.onConnectionEvent = options.onConnectionEvent;

        this.logDebug('SSEConnectionController initialized');
    }

    /**
     * Get current state for preservation
     * 
     * @returns The current SSE state
     */
    public getState(): SSEState {
        return { ...this.state };
    }

    /**
     * Perform the actual connection logic
     * 
     * @param previousState Optional state from previous connection to restore
     */
    protected async performConnect(previousState?: SSEState): Promise<void> {
        // Restore previous state if available
        if (previousState) {
            this.state = { ...previousState };
            this.logDebug('Restored previous state', this.state);
        }
        // Clear any existing timers
        this.clearTimers();

        return new Promise((resolve, reject) => {
            try {
                // Create EventSource
                this.eventSource = new EventSource(this.url);

                // Set connection timeout
                this.connectionTimer = setTimeout(() => {
                    if (!this.isConnected) {
                        const error = new Error('Connection timeout');
                        this.handleConnectionError(error, SSEErrorType.TIMEOUT_ERROR);
                        reject(error);
                    }
                }, this.connectionTimeout);

                // Set up event listeners
                this.eventSource.onopen = () => {
                    console.log("Successfully opened")
                    // TODO Figure out why this only gets triggered when we first get a SSE
                    // this.handleSuccessfulConnection();
                    // resolve();
                };

                this.eventSource.onerror = (error) => {
                    const errorObj = new Error('SSE connection error');
                    this.handleConnectionError(errorObj, SSEErrorType.CONNECTION_ERROR, { originalError: error });

                    // Only reject the promise if we're not connected yet
                    if (!this.isConnected) {
                        reject(errorObj);
                    }
                };

                // Set up specific event listeners
                this.setupEventListeners();
                this.handleSuccessfulConnection();
                resolve();
            } catch (error) {
                this.handleConnectionError(error as Error, SSEErrorType.CONNECTION_ERROR);
                reject(error);
            }
        });
    }

    /**
     * Perform the actual disconnection logic
     */
    protected async performDisconnect(): Promise<void> {
        return new Promise<void>((resolve) => {
            // Clear any pending timers first to prevent reconnection attempts during disconnect
            this.clearTimers();

            if (!this.eventSource) {
                this.logDebug('No active EventSource to disconnect');
                resolve();
                return;
            }

            // Clean up event listeners
            this.cleanupEventListeners();

            // Close the EventSource
            try {
                this.eventSource.close();
            } catch (error) {
                this.logDebug('Error during EventSource close', error);
                // Continue with cleanup even if close fails
            }

            // Clear EventSource reference
            this.eventSource = null;

            // Reset reconnection flags
            this.isReconnecting = false;

            // Notify about disconnection event if handler exists
            if (this.onConnectionEvent) {
                this.onConnectionEvent('disconnect', {
                    unexpected: false,
                    timestamp: Date.now(),
                    clean: true
                });
            }

            this.logDebug('SSE disconnected successfully');
            resolve();
        });
    }

    /**
     * Set up SSE event listeners
     */
    private setupEventListeners(): void {
        if (!this.eventSource) {
            this.logDebug('Cannot setup event listeners: EventSource not created');
            return;
        }

        // Create event listener for new stream events
        const newStreamHandler = (event: MessageEvent) => {
            try {
                const data = JSON.parse(event.data);
                this.state.hlsUrl = data.hlsUrl.replace('nginx-rtmp:8080', 'localhost:8080');
                this.state.streamId = data.id;
                this.logDebug('Received new stream event', data);
            } catch (error) {
                this.logDebug('Failed to process new stream event', error);
            }
        };

        // Create event listener for stream updates
        const streamUpdateHandler = (event: MessageEvent) => {
            try {
                const data = JSON.parse(event.data);
                if (this.state.stream) {
                    this.state.stream = {
                        ...this.state.stream,
                        title: data.title,
                        timeRemaining: data.timeRemaining,
                        user: {
                            ...this.state.stream.user,
                            username: data.streamerName
                        }
                    };
                }
                this.logDebug('Received stream update event', data);
            } catch (error) {
                this.logDebug('Failed to process stream update event', error);
            }
        };

        // Create event listener for stream expiration
        const streamExpirationHandler = (event: MessageEvent) => {
            try {
                const newExpirationTime = JSON.parse(event.data);
                this.state.expirationTime = newExpirationTime;
                this.logDebug('Received stream expiration event', newExpirationTime);
            } catch (error) {
                this.logDebug('Failed to process stream expiration event', error);
            }
        };

        // Create event listener for stream ended
        const streamEndedHandler = (event: MessageEvent) => {
            try {
                const data = JSON.parse(event.data);
                // Clear all stream-related state
                this.state.hlsUrl = '';
                this.state.expirationTime = null;
                this.state.stream = null;
                this.state.streamId = '';
                this.logDebug('Received stream ended event', data);
            } catch (error) {
                this.logDebug('Failed to process stream ended event', error);
            }
        };

        // Create event listener for stream metadata updates
        const streamMetadataUpdateHandler = (event: MessageEvent) => {
            try {
                const data = JSON.parse(event.data);
                // Update title and description if we have a current stream
                if (this.state.stream) {
                    this.state.stream = {
                        ...this.state.stream,
                        title: data.title || this.state.stream.title,
                        description: data.description
                    };
                    this.logDebug('Received stream metadata update event', data);
                }
            } catch (error) {
                this.logDebug('Failed to process stream metadata update event', error);
            }
        };

        // Add event listeners to EventSource
        this.eventSource.addEventListener('new-stream', newStreamHandler);
        this.eventSource.addEventListener('stream-update', streamUpdateHandler);
        this.eventSource.addEventListener('stream-expiration', streamExpirationHandler);
        this.eventSource.addEventListener('stream-ended', streamEndedHandler);
        this.eventSource.addEventListener('stream-metadata-update', streamMetadataUpdateHandler);

        // Store event listeners for later cleanup
        this.eventListeners.set('new-stream', newStreamHandler);
        this.eventListeners.set('stream-update', streamUpdateHandler);
        this.eventListeners.set('stream-expiration', streamExpirationHandler);
        this.eventListeners.set('stream-ended', streamEndedHandler);
        this.eventListeners.set('stream-metadata-update', streamMetadataUpdateHandler);

        this.logDebug('Event listeners set up successfully');
    }

    /**
     * Clean up SSE event listeners
     */
    private cleanupEventListeners(): void {
        if (!this.eventSource) {
            return;
        }

        // Remove all event listeners
        this.eventListeners.forEach((listener, eventName) => {
            try {
                this.eventSource?.removeEventListener(eventName, listener);
            } catch (error) {
                this.logDebug(`Error removing event listener for ${eventName}`, error);
            }
        });

        // Clear the event listeners map
        this.eventListeners.clear();
        this.logDebug('Event listeners cleaned up');
    }

    /**
     * Handle successful connection
     */
    private handleSuccessfulConnection(): void {
        // Clear connection timeout
        if (this.connectionTimer) {
            clearTimeout(this.connectionTimer);
            this.connectionTimer = null;
        }

        // Reset error counters on successful connection
        this.errorCount = 0;
        this.lastErrorTime = 0;
        this.isReconnecting = false;

        // IMPORTANT: Set the isConnected flag from the base class
        // This prevents the timeout from firing
        this.isConnected = true;

        this.logDebug('SSE connected successfully');

        // Fetch initial stream data immediately
        this.fetchInitialStreamData();

        // Also fetch initial stream data after a short delay as a fallback
        // This ensures we get the data even if the first fetch happens too early
        setTimeout(() => {
            this.fetchInitialStreamData();
        }, 500);

        // Notify about connection event
        if (this.onConnectionEvent) {
            this.onConnectionEvent('connect', { timestamp: Date.now() });
        }
    }

    /**
     * Fetch initial stream data
     */
    private async fetchInitialStreamData(): Promise<void> {
        try {
            // Extract base URL from SSE URL
            const baseUrl = this.url.split('/subscribe')[0];
            const response = await fetch(`${baseUrl}/active`);
            console.log("FETCHING RESPONSE: ", response);
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }

            const data = await response.json();

            // Check if there's actually an active stream
            if (data && data.active && data.hlsUrl) {
                // Update state with initial data
                this.state.hlsUrl = data.hlsUrl.replace('nginx-rtmp:8080', 'localhost:8080');
                this.state.stream = {
                    id: data.id || '',
                    streamKey: data.streamKey || '',
                    rtmpUrl: data.rtmpUrl || '',
                    hlsUrl: data.hlsUrl,
                    active: data.active,
                    title: data.title || '',
                    description: data.description,
                    status: data.status || '',
                    user: data.user || {
                        id: data.streamerId || '',
                        email: '',
                        username: data.streamerName || '',
                        streamKey: '',
                        createdTs: '',
                        lastModifiedTs: ''
                    },
                    timeRemaining: data.timeRemaining
                };
                this.state.streamId = data.id || '';

                // Also set expiration time if available
                if (data.expirationTime) {
                    this.state.expirationTime = data.expirationTime;
                }

                this.logDebug('Fetched initial stream data', data);

                // Trigger a state change event to notify React components immediately
                if (this.onConnectionEvent) {
                    this.onConnectionEvent('connect', {
                        timestamp: Date.now(),
                        initialDataFetched: true,
                        streamData: this.state
                    });
                }
            } else {
                this.logDebug('No active stream found', data);
                // Clear state if no active stream
                this.state.hlsUrl = '';
                this.state.stream = null;
                this.state.streamId = '';
                this.state.expirationTime = null;
            }
        } catch (error) {
            this.logDebug('Failed to fetch initial stream data', error);
            // Clear state on error
            this.state.hlsUrl = '';
            this.state.stream = null;
            this.state.streamId = '';
            this.state.expirationTime = null;
        }
    }

    /**
     * Handle connection errors
     * 
     * @param error The error that occurred
     * @param errorType The type of error
     * @param metadata Additional metadata about the error
     */
    private handleConnectionError(error: Error, errorType: SSEErrorType, metadata?: any): void {
        this.logDebug(`SSE error: ${errorType}`, { error, metadata });

        // Increment error counter
        this.errorCount++;
        this.lastErrorTime = Date.now();

        // Notify about error event
        if (this.onConnectionEvent) {
            this.onConnectionEvent('error', {
                error: error.message,
                errorType,
                timestamp: this.lastErrorTime,
                metadata
            });
        }

        // Clear any existing timers
        this.clearTimers();
    }

    /**
     * Attempt to reconnect with exponential backoff
     */
    private attemptReconnection(): void {
        // Don't attempt reconnection if we're already reconnecting
        if (this.isReconnecting) {
            this.logDebug('Already attempting to reconnect, skipping');
            return;
        }

        this.isReconnecting = true;

        // Calculate delay based on connection attempts
        const delay = this.calculateBackoffDelay();

        this.logDebug(`Attempting reconnection in ${delay}ms (attempt ${this.connectionAttempts + 1}/${this.maxConnectionAttempts})`);

        // Notify about reconnection attempt
        if (this.onConnectionEvent) {
            this.onConnectionEvent('reconnect', {
                attempt: this.connectionAttempts + 1,
                maxAttempts: this.maxConnectionAttempts,
                delay,
                timestamp: Date.now()
            });
        }

        // Schedule reconnection attempt
        this.reconnectTimer = setTimeout(() => {
            // Save current state for restoration
            const currentState = this.getState();

            // Attempt to connect
            this.connect(currentState).catch(error => {
                this.logDebug('Reconnection attempt failed', error);
                // handleError is called by connect() on failure
            });
        }, delay);
    }

    /**
     * Clear all timers to prevent memory leaks
     */
    private clearTimers(): void {
        if (this.connectionTimer) {
            clearTimeout(this.connectionTimer);
            this.connectionTimer = null;
        }

        if (this.reconnectTimer) {
            clearTimeout(this.reconnectTimer);
            this.reconnectTimer = null;
        }
    }

    /**
     * Override the base handleError method to provide more specific error handling
     * 
     * @param error The error that occurred
     */
    public override handleError(error: Error): void {
        // Call the base implementation
        super.handleError(error);

        // Determine error type if not already known
        let errorType = SSEErrorType.UNKNOWN_ERROR;

        if (error.message.includes('timeout')) {
            errorType = SSEErrorType.TIMEOUT_ERROR;
        } else if (error.message.includes('network') || error.name === 'NetworkError') {
            errorType = SSEErrorType.NETWORK_ERROR;
        }

        // Handle the error with the determined type
        this.handleConnectionError(error, errorType);

        // If we've reached the maximum number of connection attempts, stop trying
        if (this.connectionAttempts >= this.maxConnectionAttempts) {
            this.logDebug('Maximum connection attempts reached, giving up');

            // Notify about final failure
            if (this.onConnectionEvent) {
                this.onConnectionEvent('error', {
                    error: 'Maximum connection attempts reached',
                    errorType: SSEErrorType.CONNECTION_ERROR,
                    final: true,
                    timestamp: Date.now()
                });
            }

            return;
        }

        // Otherwise, attempt reconnection
        this.attemptReconnection();
    }

    /**
     * Clean up resources when the controller is no longer needed
     * This should be called when the controller is being disposed of
     */
    public dispose(): void {
        this.logDebug('Disposing SSEConnectionController');

        // Disconnect if connected
        if (this.isConnected) {
            this.disconnect().catch(error => {
                this.logDebug('Error during disconnect while disposing', error);
            });
        }

        // Clear all timers
        this.clearTimers();

        // Clean up event listeners
        this.cleanupEventListeners();

        // Clear state to help garbage collection
        this.eventSource = null;
        this.eventListeners.clear();
        this.state = {
            hlsUrl: '',
            stream: null,
            expirationTime: null,
            streamId: ''
        };
    }
}