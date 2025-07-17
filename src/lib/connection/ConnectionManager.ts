import { 
  ConnectionController, 
  ConnectionManagerConfig, 
  ConnectionManagerState,
  ConnectionHistoryEntry
} from './types';

/**
 * ConnectionManager
 * 
 * Core component responsible for orchestrating connection state based on routing.
 * Manages the lifecycle of connection controllers and determines when connections
 * should be active based on the current route.
 */
export class ConnectionManager {
  private controllers: ConnectionController[] = [];
  private state: ConnectionManagerState;
  private debounceTimer: NodeJS.Timeout | null = null;
  private preservedStates: Map<string, any> = new Map();

  /**
   * Creates a new ConnectionManager instance
   * 
   * @param config Configuration options for the ConnectionManager
   */
  constructor(private config: ConnectionManagerConfig) {
    this.state = {
      isActive: false,
      currentRoute: '/',
      previousRoute: null,
      connectionHistory: []
    };

    // Set default debounce time if not provided
    if (this.config.debounceTime === undefined) {
      this.config.debounceTime = 300; // Default debounce of 300ms
    }

    this.logDebug('ConnectionManager initialized', { config });
  }

  /**
   * Registers a connection controller with the manager
   * 
   * @param controller The controller to register
   * @returns The ConnectionManager instance for chaining
   */
  public registerController(controller: ConnectionController): ConnectionManager {
    // Check if controller with same ID already exists
    const existingIndex = this.controllers.findIndex(c => c.id === controller.id);
    
    if (existingIndex >= 0) {
      this.logDebug(`Controller with ID ${controller.id} already registered, replacing`);
      this.controllers[existingIndex] = controller;
    } else {
      this.controllers.push(controller);
      this.logDebug(`Registered controller: ${controller.id}`);
    }
    
    return this;
  }

  /**
   * Handles route changes and manages connections accordingly
   * 
   * @param newRoute The new route the user has navigated to
   */
  public handleRouteChange(newRoute: string): void {
    this.logDebug(`Route change detected: ${this.state.currentRoute} -> ${newRoute}`);
    
    // Update route history
    this.state.previousRoute = this.state.currentRoute;
    this.state.currentRoute = newRoute;
    
    // Debounce connection state changes to prevent thrashing during rapid navigation
    if (this.debounceTimer) {
      clearTimeout(this.debounceTimer);
    }
    
    this.debounceTimer = setTimeout(() => {
      const shouldBeActive = this.shouldBeActive(newRoute);
      
      if (shouldBeActive && !this.state.isActive) {
        this.activateConnections();
      } else if (!shouldBeActive && this.state.isActive) {
        this.deactivateConnections();
      } else {
        this.logDebug(`No connection state change needed for route: ${newRoute}`);
      }
      
      this.debounceTimer = null;
    }, this.config.debounceTime);
  }

  /**
   * Determines if connections should be active for the given route
   * 
   * @param route The route to check
   * @returns True if connections should be active, false otherwise
   */
  public shouldBeActive(route: string): boolean {
    // Check if the route matches any of the active routes
    return this.config.activeRoutes.some(activeRoute => {
      // Exact match
      if (activeRoute === route) {
        return true;
      }
      
      // Pattern match (simple wildcard support)
      if (activeRoute.endsWith('*')) {
        const prefix = activeRoute.slice(0, -1);
        return route.startsWith(prefix);
      }
      
      // Regex match (if activeRoute is a valid regex pattern)
      try {
        const regex = new RegExp(activeRoute);
        return regex.test(route);
      } catch (e) {
        // Not a valid regex, ignore
        return false;
      }
    });
  }

  /**
   * Activates all registered connections
   */
  public async activateConnections(): Promise<void> {
    if (this.controllers.length === 0) {
      this.logDebug('No controllers registered, skipping activation');
      return;
    }

    this.logDebug(`Activating connections for route: ${this.state.currentRoute}`);
    this.state.isActive = true;
    
    // Add to connection history
    this.addToHistory('connect');
    
    // Activate each controller
    const activationPromises = this.controllers.map(async controller => {
      try {
        // Get preserved state if available
        const previousState = this.preservedStates.get(controller.id);
        
        await controller.connect(previousState);
        this.logDebug(`Controller ${controller.id} activated successfully`);
        
        // Clear preserved state after successful connection
        if (previousState) {
          this.preservedStates.delete(controller.id);
        }
      } catch (error) {
        this.logDebug(`Failed to activate controller ${controller.id}`, { error });
        controller.handleError(error as Error);
      }
    });
    
    await Promise.all(activationPromises);
  }

  /**
   * Deactivates all registered connections
   */
  public async deactivateConnections(): Promise<void> {
    if (this.controllers.length === 0) {
      this.logDebug('No controllers registered, skipping deactivation');
      return;
    }

    this.logDebug(`Deactivating connections for route: ${this.state.currentRoute}`);
    this.state.isActive = false;
    
    // Add to connection history
    this.addToHistory('disconnect');
    
    // Deactivate each controller
    const deactivationPromises = this.controllers.map(async controller => {
      try {
        // Only disconnect if currently connected
        if (controller.isConnected) {
          // Get state before disconnecting for preservation
          const state = await controller.disconnect();
          
          // Preserve state for potential restoration
          if (state) {
            this.preservedStates.set(controller.id, state);
            this.logDebug(`Preserved state for controller ${controller.id}`);
          }
          
          this.logDebug(`Controller ${controller.id} deactivated successfully`);
        }
      } catch (error) {
        this.logDebug(`Failed to deactivate controller ${controller.id}`, { error });
        controller.handleError(error as Error);
      }
    });
    
    await Promise.all(deactivationPromises);
  }

  /**
   * Gets the current state of the ConnectionManager
   */
  public getState(): ConnectionManagerState {
    return { ...this.state };
  }

  /**
   * Gets all registered controllers
   */
  public getControllers(): ConnectionController[] {
    return [...this.controllers];
  }

  /**
   * Adds an entry to the connection history
   */
  private addToHistory(action: 'connect' | 'disconnect'): void {
    const entry: ConnectionHistoryEntry = {
      route: this.state.currentRoute,
      action,
      timestamp: Date.now()
    };
    
    this.state.connectionHistory.push(entry);
    
    // Limit history size to prevent memory issues
    if (this.state.connectionHistory.length > 100) {
      this.state.connectionHistory.shift();
    }
  }

  /**
   * Logs debug messages if debug mode is enabled
   */
  private logDebug(message: string, data?: any): void {
    if (this.config.debug) {
      console.log(`[ConnectionManager] ${message}`, data || '');
    }
  }
}