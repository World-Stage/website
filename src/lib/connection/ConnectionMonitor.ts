import { ConnectionEvent, ConnectionEventType, ConnectionController } from './types';
import { ConnectionManager } from './ConnectionManager';

/**
 * Options for the ConnectionMonitor
 */
export interface ConnectionMonitorOptions {
  /**
   * Whether to enable debug logging
   */
  debug?: boolean;
  
  /**
   * Maximum number of events to keep in history
   */
  maxEventHistory?: number;
  
  /**
   * Whether to log events to console
   */
  consoleLogging?: boolean;
  
  /**
   * Custom event handler for connection events
   */
  onEvent?: (event: ConnectionEvent) => void;
}

/**
 * Connection status for a specific controller
 */
export interface ControllerStatus {
  id: string;
  connected: boolean;
  lastConnected: number | null;
  lastDisconnected: number | null;
  reconnectAttempts: number;
  errors: Array<{
    message: string;
    timestamp: number;
  }>;
}

/**
 * Overall connection status
 */
export interface ConnectionStatus {
  isActive: boolean;
  currentRoute: string;
  controllers: ControllerStatus[];
  lastUpdated: number;
}

/**
 * ConnectionMonitor
 * 
 * Utility for monitoring and logging connection status and events.
 * Provides debugging capabilities for connection management.
 */
export class ConnectionMonitor {
  private eventHistory: ConnectionEvent[] = [];
  private options: Required<ConnectionMonitorOptions>;
  private controllerStatuses: Map<string, ControllerStatus> = new Map();
  
  /**
   * Creates a new ConnectionMonitor
   * 
   * @param connectionManager The ConnectionManager to monitor
   * @param options Configuration options
   */
  constructor(
    private connectionManager: ConnectionManager,
    options?: ConnectionMonitorOptions
  ) {
    // Set default options
    this.options = {
      debug: options?.debug ?? false,
      maxEventHistory: options?.maxEventHistory ?? 100,
      consoleLogging: options?.consoleLogging ?? true,
      onEvent: options?.onEvent ?? (() => {})
    };
    
    this.logDebug('ConnectionMonitor initialized');
    
    // Initialize controller statuses
    this.updateControllerStatuses();
  }

  /**
   * Records a connection event
   * 
   * @param type The type of event
   * @param controllerId The ID of the controller that triggered the event
   * @param metadata Additional metadata for the event
   */
  public recordEvent(
    type: ConnectionEventType,
    controllerId: string,
    metadata?: Record<string, any>
  ): void {
    const event: ConnectionEvent = {
      type,
      controllerId,
      timestamp: Date.now(),
      route: this.connectionManager.getState().currentRoute,
      metadata
    };
    
    // Add to history
    this.eventHistory.push(event);
    
    // Trim history if needed
    if (this.eventHistory.length > this.options.maxEventHistory) {
      this.eventHistory.shift();
    }
    
    // Update controller status
    this.updateControllerStatus(controllerId, type);
    
    // Log to console if enabled
    if (this.options.consoleLogging) {
      this.logEvent(event);
    }
    
    // Call custom event handler if provided
    this.options.onEvent(event);
  }

  /**
   * Gets the event history
   * 
   * @param limit Optional limit on the number of events to return
   * @param controllerId Optional filter by controller ID
   * @param eventType Optional filter by event type
   * @returns The filtered event history
   */
  public getEventHistory(
    limit?: number,
    controllerId?: string,
    eventType?: ConnectionEventType
  ): ConnectionEvent[] {
    let filteredEvents = [...this.eventHistory];
    
    // Apply filters
    if (controllerId) {
      filteredEvents = filteredEvents.filter(e => e.controllerId === controllerId);
    }
    
    if (eventType) {
      filteredEvents = filteredEvents.filter(e => e.type === eventType);
    }
    
    // Apply limit
    if (limit && limit > 0) {
      filteredEvents = filteredEvents.slice(-limit);
    }
    
    return filteredEvents;
  }

  /**
   * Gets the current connection status
   * 
   * @returns The current connection status
   */
  public getStatus(): ConnectionStatus {
    this.updateControllerStatuses();
    
    const managerState = this.connectionManager.getState();
    
    return {
      isActive: managerState.isActive,
      currentRoute: managerState.currentRoute,
      controllers: Array.from(this.controllerStatuses.values()),
      lastUpdated: Date.now()
    };
  }

  /**
   * Clears the event history
   */
  public clearEventHistory(): void {
    this.eventHistory = [];
    this.logDebug('Event history cleared');
  }

  /**
   * Updates the status of all controllers
   */
  private updateControllerStatuses(): void {
    const controllers = this.connectionManager.getControllers();
    
    controllers.forEach(controller => {
      const existingStatus = this.controllerStatuses.get(controller.id);
      
      if (existingStatus) {
        // Update connection status
        existingStatus.connected = controller.isConnected;
      } else {
        // Create new status entry
        this.controllerStatuses.set(controller.id, {
          id: controller.id,
          connected: controller.isConnected,
          lastConnected: null,
          lastDisconnected: null,
          reconnectAttempts: 0,
          errors: []
        });
      }
    });
  }

  /**
   * Updates the status of a specific controller based on an event
   * 
   * @param controllerId The ID of the controller
   * @param eventType The type of event
   */
  private updateControllerStatus(
    controllerId: string,
    eventType: ConnectionEventType
  ): void {
    const status = this.controllerStatuses.get(controllerId);
    
    if (!status) {
      return;
    }
    
    const now = Date.now();
    
    switch (eventType) {
      case 'connect':
        status.connected = true;
        status.lastConnected = now;
        status.reconnectAttempts = 0;
        break;
        
      case 'disconnect':
        status.connected = false;
        status.lastDisconnected = now;
        break;
        
      case 'reconnect':
        status.reconnectAttempts++;
        break;
        
      case 'error':
        status.errors.push({
          message: 'Connection error',
          timestamp: now
        });
        
        // Limit error history
        if (status.errors.length > 10) {
          status.errors.shift();
        }
        break;
    }
  }

  /**
   * Logs an event to the console
   * 
   * @param event The event to log
   */
  private logEvent(event: ConnectionEvent): void {
    const timestamp = new Date(event.timestamp).toISOString();
    const message = `[${timestamp}] [${event.controllerId}] ${event.type.toUpperCase()} on route "${event.route}"`;
    
    switch (event.type) {
      case 'connect':
        console.log(`%c${message}`, 'color: green', event.metadata || '');
        break;
        
      case 'disconnect':
        console.log(`%c${message}`, 'color: orange', event.metadata || '');
        break;
        
      case 'reconnect':
        console.log(`%c${message}`, 'color: blue', event.metadata || '');
        break;
        
      case 'error':
        console.error(`%c${message}`, 'color: red', event.metadata || '');
        break;
        
      default:
        console.log(message, event.metadata || '');
    }
  }

  /**
   * Logs debug messages if debug mode is enabled
   * 
   * @param message The message to log
   * @param data Optional data to include in the log
   */
  private logDebug(message: string, data?: any): void {
    if (this.options.debug) {
      console.log(`[ConnectionMonitor] ${message}`, data || '');
    }
  }
}