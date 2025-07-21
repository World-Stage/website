import { ConnectionController } from './types';

/**
 * Abstract base class for connection controllers
 * 
 * Provides common functionality and state management for all connection controllers.
 * Specific connection types (WebSocket, SSE, etc.) should extend this class.
 */
export abstract class BaseConnectionController implements ConnectionController {
  /**
   * Unique identifier for this controller
   */
  public abstract id: string;
  
  /**
   * Current connection state
   */
  public isConnected: boolean = false;
  
  /**
   * Number of connection attempts made since last successful connection
   */
  protected connectionAttempts: number = 0;
  
  /**
   * Maximum number of connection attempts before giving up
   */
  protected maxConnectionAttempts: number = 5;
  
  /**
   * Base delay for exponential backoff (in ms)
   */
  protected baseReconnectDelay: number = 1000;
  
  /**
   * Whether debug logging is enabled
   */
  protected debug: boolean = false;

  /**
   * Creates a new BaseConnectionController
   * 
   * @param options Configuration options
   */
  constructor(options?: {
    maxConnectionAttempts?: number;
    baseReconnectDelay?: number;
    debug?: boolean;
  }) {
    if (options) {
      this.maxConnectionAttempts = options.maxConnectionAttempts ?? this.maxConnectionAttempts;
      this.baseReconnectDelay = options.baseReconnectDelay ?? this.baseReconnectDelay;
      this.debug = options.debug ?? this.debug;
    }
  }

  /**
   * Connect with optional state restoration
   * 
   * @param previousState Optional state from previous connection to restore
   */
  public async connect(previousState?: any): Promise<void> {
    if (this.isConnected) {
      this.logDebug('Already connected, ignoring connect request');
      return;
    }

    try {
      this.logDebug('Connecting...');
      await this.performConnect(previousState);
      this.isConnected = true;
      this.connectionAttempts = 0;
      this.logDebug('Connected successfully');
    } catch (error) {
      this.connectionAttempts++;
      this.logDebug(`Connection failed (attempt ${this.connectionAttempts}/${this.maxConnectionAttempts})`, error);
      
      if (this.connectionAttempts < this.maxConnectionAttempts) {
        // Implement exponential backoff for reconnection
        const delay = this.calculateBackoffDelay();
        this.logDebug(`Retrying connection in ${delay}ms`);
        
        setTimeout(() => {
          this.connect(previousState).catch(e => this.handleError(e));
        }, delay);
      } else {
        this.logDebug('Maximum connection attempts reached, giving up');
        this.handleError(error as Error);
      }
    }
  }

  /**
   * Disconnect with state preservation
   * 
   * @returns The preserved state that can be used to restore the connection later
   */
  public async disconnect(): Promise<any> {
    if (!this.isConnected) {
      this.logDebug('Not connected, ignoring disconnect request');
      return null;
    }

    try {
      this.logDebug('Disconnecting...');
      const state = this.getState();
      await this.performDisconnect();
      this.isConnected = false;
      this.logDebug('Disconnected successfully');
      return state;
    } catch (error) {
      this.logDebug('Disconnect failed', error);
      this.handleError(error as Error);
      return null;
    }
  }

  /**
   * Get current state for preservation
   * 
   * @returns The current state that should be preserved during disconnection
   */
  public abstract getState(): any;

  /**
   * Handle connection errors
   * 
   * @param error The error that occurred
   */
  public handleError(error: Error): void {
    this.logDebug('Error in connection controller', error);
    // Base implementation just logs the error
    // Subclasses should override this to provide specific error handling
  }

  /**
   * Perform the actual connection logic
   * 
   * @param previousState Optional state from previous connection to restore
   */
  protected abstract performConnect(previousState?: any): Promise<void>;

  /**
   * Perform the actual disconnection logic
   */
  protected abstract performDisconnect(): Promise<void>;

  /**
   * Calculate the delay for exponential backoff
   * 
   * @returns The delay in milliseconds
   */
  protected calculateBackoffDelay(): number {
    // Exponential backoff with jitter
    const exponentialPart = Math.pow(2, this.connectionAttempts - 1) * this.baseReconnectDelay;
    const jitter = Math.random() * 0.3 * exponentialPart; // 0-30% jitter
    return exponentialPart + jitter;
  }

  /**
   * Log debug messages if debug mode is enabled
   * 
   * @param message The message to log
   * @param data Optional data to include in the log
   */
  protected logDebug(message: string, data?: any): void {
    if (this.debug) {
      console.log(`[${this.id}] ${message}`, data || '');
    }
  }
}