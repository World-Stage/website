/**
 * RouteChangeDetector
 * 
 * Utility for detecting and handling route changes in Next.js applications.
 * Provides debouncing for rapid navigation and supports custom callbacks.
 */

export interface RouteChangeOptions {
  // Debounce time in milliseconds
  debounceTime?: number;
  // Whether to log debug information
  debug?: boolean;
}

export interface RouteChangeHandler {
  // Called when a route change is detected
  onRouteChange: (newRoute: string, previousRoute: string | null) => void;
}

export class RouteChangeDetector {
  private currentRoute: string = '/';
  private previousRoute: string | null = null;
  private debounceTimer: NodeJS.Timeout | null = null;
  private debounceTime: number;
  private debug: boolean;
  private handlers: RouteChangeHandler[] = [];

  /**
   * Creates a new RouteChangeDetector
   * 
   * @param options Configuration options
   */
  constructor(options: RouteChangeOptions = {}) {
    this.debounceTime = options.debounceTime ?? 300;
    this.debug = options.debug ?? false;
  }

  /**
   * Registers a handler to be called when a route change is detected
   * 
   * @param handler The handler to register
   * @returns The RouteChangeDetector instance for chaining
   */
  public registerHandler(handler: RouteChangeHandler): RouteChangeDetector {
    this.handlers.push(handler);
    this.logDebug(`Registered route change handler, total handlers: ${this.handlers.length}`);
    return this;
  }

  /**
   * Unregisters a handler
   * 
   * @param handler The handler to unregister
   * @returns The RouteChangeDetector instance for chaining
   */
  public unregisterHandler(handler: RouteChangeHandler): RouteChangeDetector {
    const index = this.handlers.indexOf(handler);
    if (index !== -1) {
      this.handlers.splice(index, 1);
      this.logDebug(`Unregistered route change handler, remaining handlers: ${this.handlers.length}`);
    }
    return this;
  }

  /**
   * Handles a route change
   * 
   * @param newRoute The new route
   */
  public handleRouteChange(newRoute: string): void {
    // Don't process if the route hasn't actually changed
    if (newRoute === this.currentRoute) {
      return;
    }

    this.logDebug(`Route change detected: ${this.currentRoute} -> ${newRoute}`);
    
    // Update route history
    this.previousRoute = this.currentRoute;
    this.currentRoute = newRoute;
    
    // Debounce route change notifications to prevent thrashing during rapid navigation
    if (this.debounceTimer) {
      clearTimeout(this.debounceTimer);
    }
    
    this.debounceTimer = setTimeout(() => {
      this.notifyHandlers();
      this.debounceTimer = null;
    }, this.debounceTime);
  }

  /**
   * Gets the current route
   * 
   * @returns The current route
   */
  public getCurrentRoute(): string {
    return this.currentRoute;
  }

  /**
   * Gets the previous route
   * 
   * @returns The previous route, or null if there is no previous route
   */
  public getPreviousRoute(): string | null {
    return this.previousRoute;
  }

  /**
   * Notifies all registered handlers of a route change
   */
  private notifyHandlers(): void {
    this.logDebug(`Notifying ${this.handlers.length} handlers of route change to ${this.currentRoute}`);
    
    for (const handler of this.handlers) {
      try {
        handler.onRouteChange(this.currentRoute, this.previousRoute);
      } catch (error) {
        console.error('Error in route change handler:', error);
      }
    }
  }

  /**
   * Logs debug messages if debug mode is enabled
   * 
   * @param message The message to log
   * @param data Optional data to log
   */
  private logDebug(message: string, data?: any): void {
    if (this.debug) {
      console.log(`[RouteChangeDetector] ${message}`, data || '');
    }
  }
}