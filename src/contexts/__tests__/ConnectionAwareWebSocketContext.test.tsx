import React from 'react';
import { render, screen, act } from '@testing-library/react';
import { ConnectionAwareWebSocketProvider, useWebSocket } from '../ConnectionAwareWebSocketContext';
import { ConnectionManager } from '../../lib/connection/ConnectionManager';
import { AuthContext } from '../AuthContext';
import { WebSocketConnectionController } from '../../lib/connection/WebSocketConnectionController';

// Mock dependencies
jest.mock('../../lib/connection/ConnectionManager');
jest.mock('../../lib/connection/WebSocketConnectionController');

// Mock AuthContext
const mockAuthContext = {
  user: { id: 'user123', username: 'testuser' },
  isAuthenticated: true,
  login: jest.fn(),
  logout: jest.fn(),
  signup: jest.fn(),
  loading: false,
  error: null
};

// Test component that uses the WebSocket context
function TestComponent() {
  const { messages, viewers, encoreInformation, hasEncored, isConnected } = useWebSocket();
  
  return (
    <div>
      <div data-testid="connection-status">{isConnected ? 'connected' : 'disconnected'}</div>
      <div data-testid="message-count">{messages.length}</div>
      <div data-testid="viewer-count">{viewers}</div>
      <div data-testid="encore-status">{hasEncored ? 'encored' : 'not-encored'}</div>
      <div data-testid="encore-total">{encoreInformation?.encoreTotal || 0}</div>
    </div>
  );
}

describe('ConnectionAwareWebSocketProvider', () => {
  let mockConnectionManager: jest.Mocked<ConnectionManager>;
  let mockController: jest.Mocked<WebSocketConnectionController>;
  
  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();
    
    // Setup mock controller
    mockController = new WebSocketConnectionController({
      url: 'test-url'
    }) as jest.Mocked<WebSocketConnectionController>;
    
    mockController.isConnected = true;
    mockController.getState = jest.fn().mockReturnValue({
      messages: [{ sender: 'user1', content: 'Hello', messageType: 'AUDIENCE' }],
      encoreInformation: { encoreTotal: 5, encoreNeeded: 10, encoreProgressPercent: 50 },
      hasEncored: false,
      viewers: 42
    });
    mockController.sendEncore = jest.fn().mockResolvedValue(undefined);
    mockController.sendChatMessage = jest.fn().mockResolvedValue(undefined);
    mockController.setAccessToken = jest.fn();
    mockController.dispose = jest.fn();
    
    // Setup mock connection manager
    mockConnectionManager = new ConnectionManager({
      activeRoutes: ['/']
    }) as jest.Mocked<ConnectionManager>;
    
    mockConnectionManager.registerController = jest.fn().mockReturnValue(mockConnectionManager);
    
    // Mock WebSocketConnectionController constructor
    (WebSocketConnectionController as jest.Mock).mockImplementation(() => mockController);
  });
  
  it('registers the controller with the connection manager', () => {
    render(
      <AuthContext.Provider value={mockAuthContext}>
        <ConnectionAwareWebSocketProvider connectionManager={mockConnectionManager}>
          <TestComponent />
        </ConnectionAwareWebSocketProvider>
      </AuthContext.Provider>
    );
    
    expect(mockConnectionManager.registerController).toHaveBeenCalledWith(mockController);
  });
  
  it('updates authentication token when user auth state changes', () => {
    const { rerender } = render(
      <AuthContext.Provider value={mockAuthContext}>
        <ConnectionAwareWebSocketProvider connectionManager={mockConnectionManager}>
          <TestComponent />
        </ConnectionAwareWebSocketProvider>
      </AuthContext.Provider>
    );
    
    expect(mockController.setAccessToken).toHaveBeenCalled();
    
    // Update auth context to simulate logout
    rerender(
      <AuthContext.Provider value={{ ...mockAuthContext, isAuthenticated: false, user: null }}>
        <ConnectionAwareWebSocketProvider connectionManager={mockConnectionManager}>
          <TestComponent />
        </ConnectionAwareWebSocketProvider>
      </AuthContext.Provider>
    );
    
    expect(mockController.setAccessToken).toHaveBeenCalledWith(null);
  });
  
  it('syncs state from controller to component state', async () => {
    // Mock localStorage
    Object.defineProperty(window, 'localStorage', {
      value: {
        getItem: jest.fn().mockReturnValue('test-token'),
        setItem: jest.fn(),
        removeItem: jest.fn()
      },
      writable: true
    });
    
    jest.useFakeTimers();
    
    render(
      <AuthContext.Provider value={mockAuthContext}>
        <ConnectionAwareWebSocketProvider connectionManager={mockConnectionManager}>
          <TestComponent />
        </ConnectionAwareWebSocketProvider>
      </AuthContext.Provider>
    );
    
    // Fast-forward timers to trigger state sync
    act(() => {
      jest.advanceTimersByTime(100);
    });
    
    expect(screen.getByTestId('message-count').textContent).toBe('1');
    expect(screen.getByTestId('viewer-count').textContent).toBe('42');
    expect(screen.getByTestId('encore-status').textContent).toBe('not-encored');
    expect(screen.getByTestId('encore-total').textContent).toBe('5');
    
    // Update mock controller state
    mockController.getState = jest.fn().mockReturnValue({
      messages: [
        { sender: 'user1', content: 'Hello', messageType: 'AUDIENCE' },
        { sender: 'user2', content: 'Hi there', messageType: 'AUDIENCE' }
      ],
      encoreInformation: { encoreTotal: 6, encoreNeeded: 10, encoreProgressPercent: 60 },
      hasEncored: true,
      viewers: 43
    });
    
    // Fast-forward timers again
    act(() => {
      jest.advanceTimersByTime(100);
    });
    
    expect(screen.getByTestId('message-count').textContent).toBe('2');
    expect(screen.getByTestId('viewer-count').textContent).toBe('43');
    expect(screen.getByTestId('encore-status').textContent).toBe('encored');
    expect(screen.getByTestId('encore-total').textContent).toBe('6');
    
    jest.useRealTimers();
  });
  
  it('cleans up resources on unmount', () => {
    const { unmount } = render(
      <AuthContext.Provider value={mockAuthContext}>
        <ConnectionAwareWebSocketProvider connectionManager={mockConnectionManager}>
          <TestComponent />
        </ConnectionAwareWebSocketProvider>
      </AuthContext.Provider>
    );
    
    unmount();
    
    expect(mockController.dispose).toHaveBeenCalled();
  });
});