import { WebSocketConnectionController, WebSocketErrorType } from '../WebSocketConnectionController';
import { Client, StompSubscription } from '@stomp/stompjs';
import { ConnectionEventType } from '../types';
import { it } from 'node:test';
import { it } from 'node:test';
import { it } from 'node:test';
import { it } from 'node:test';
import { it } from 'node:test';
import { it } from 'node:test';
import { it } from 'node:test';
import { it } from 'node:test';
import { it } from 'node:test';
import { it } from 'node:test';
import { it } from 'node:test';
import { it } from 'node:test';
import { it } from 'node:test';
import { it } from 'node:test';
import { afterEach } from 'node:test';
import { beforeEach } from 'node:test';
import { describe } from 'node:test';

// Mock timers
jest.useFakeTimers();

// Mock SockJS
jest.mock('sockjs-client', () => {
    return jest.fn().mockImplementation(() => {
        return {};
    });
});

// Mock STOMP Client
jest.mock('@stomp/stompjs', () => {
    return {
        Client: jest.fn().mockImplementation(() => {
            return {
                activate: jest.fn(),
                deactivate: jest.fn(),
                connected: true,
                subscribe: jest.fn().mockImplementation((destination) => {
                    return {
                        unsubscribe: jest.fn()
                    };
                }),
                publish: jest.fn(),
                onConnect: null,
                onDisconnect: null,
                onStompError: null
            };
        })
    };
});

// Mock fetch for viewer count
global.fetch = jest.fn().mockImplementation(() => 
    Promise.resolve({
        json: () => Promise.resolve({ viewerCount: 42 })
    })
) as jest.Mock;

describe('WebSocketConnectionController', () => {
    let controller: WebSocketConnectionController;
    let mockConnectionEventHandler: jest.Mock;

    beforeEach(() => {
        // Reset mocks
        jest.clearAllMocks();
        mockConnectionEventHandler = jest.fn();

        // Create controller instance
        controller = new WebSocketConnectionController({
            url: 'http://localhost:8082/ws',
            debug: false,
            maxConnectionAttempts: 3,
            baseReconnectDelay: 1000,
            connectionTimeout: 5000,
            onConnectionEvent: mockConnectionEventHandler
        });
    });

    afterEach(() => {
        // Clean up
        if (controller) {
            controller.dispose();
        }
    });

    it('should initialize with correct default state', () => {
        expect(controller.id).toBe('websocket');
        expect(controller.isConnected).toBe(false);
        expect(controller.getState()).toEqual({
            messages: [],
            encoreInformation: null,
            hasEncored: false,
            viewers: 0
        });
    });

    it('should connect successfully', async () => {
        const connectPromise = controller.connect();

        // Simulate successful connection
        const mockClient = (Client as jest.Mock).mock.results[0].value;
        mockClient.onConnect();

        await connectPromise;

        expect(controller.isConnected).toBe(true);
        expect(mockClient.activate).toHaveBeenCalled();
        expect(mockConnectionEventHandler).toHaveBeenCalledWith('connect', expect.any(Object));
    });

    it('should disconnect successfully', async () => {
        // First connect
        const connectPromise = controller.connect();
        const mockClient = (Client as jest.Mock).mock.results[0].value;
        mockClient.onConnect();
        await connectPromise;

        // Then disconnect
        await controller.disconnect();

        expect(controller.isConnected).toBe(false);
        expect(mockClient.deactivate).toHaveBeenCalled();
    });

    it('should restore previous state when reconnecting', async () => {
        // Create a previous state
        const previousState = {
            messages: [{ sender: 'test', content: 'hello', messageType: 'AUDIENCE' }],
            encoreInformation: { encoreTotal: 5, encoreNeeded: 10, encoreProgressPercent: 50 },
            hasEncored: true,
            viewers: 42
        };

        // Connect with previous state
        const connectPromise = controller.connect(previousState);
        const mockClient = (Client as jest.Mock).mock.results[0].value;
        mockClient.onConnect();
        await connectPromise;

        // Check if state was restored
        expect(controller.getState()).toEqual(previousState);
    });

    it('should send encore correctly', async () => {
        // First connect
        const connectPromise = controller.connect();
        const mockClient = (Client as jest.Mock).mock.results[0].value;
        mockClient.onConnect();
        await connectPromise;

        // Send encore
        await controller.sendEncore('user123');

        // Check if encore was sent
        expect(mockClient.publish).toHaveBeenCalledWith({
            destination: '/app/encore',
            headers: {},
            body: JSON.stringify({ userId: 'user123' })
        });

        // Check if state was updated
        const state = controller.getState();
        expect(state.hasEncored).toBe(true);
        expect(state.encoreInformation).not.toBeNull();
        expect(state.encoreInformation?.encoreTotal).toBe(1);
    });

    it('should send chat message correctly', async () => {
        // First connect
        const connectPromise = controller.connect();
        const mockClient = (Client as jest.Mock).mock.results[0].value;
        mockClient.onConnect();
        await connectPromise;

        // Create message
        const message = {
            sender: 'user123',
            content: 'Hello world',
            messageType: 'AUDIENCE' as const
        };

        // Send message
        await controller.sendChatMessage(message);

        // Check if message was sent
        expect(mockClient.publish).toHaveBeenCalledWith({
            destination: '/app/send',
            headers: {},
            body: JSON.stringify(message)
        });
    });

    it('should use authentication token when available', async () => {
        // Set access token
        controller.setAccessToken('test-token');

        // Connect
        const connectPromise = controller.connect();

        // Check if token was used in connection headers
        expect(Client).toHaveBeenCalledWith(
            expect.objectContaining({
                connectHeaders: {
                    'Authorization': 'Bearer test-token'
                }
            })
        );

        // Complete connection
        const mockClient = (Client as jest.Mock).mock.results[0].value;
        mockClient.onConnect();
        await connectPromise;

        // Send a message with auth
        const message = {
            sender: 'user123',
            content: 'Hello world',
            messageType: 'AUDIENCE' as const
        };

        await controller.sendChatMessage(message);

        // Check if token was used in message headers
        expect(mockClient.publish).toHaveBeenCalledWith({
            destination: '/app/send',
            headers: {
                'Authorization': 'Bearer test-token'
            },
            body: JSON.stringify(message)
        });
    });

    // New tests for reconnection and error handling

    it('should handle connection timeout', async () => {
        // Start connection but don't complete it
        const connectPromise = controller.connect().catch(() => {});
        
        // Advance timers to trigger timeout
        jest.advanceTimersByTime(6000);
        
        await Promise.resolve(); // Let promises resolve
        
        // Check that error was handled
        expect(mockConnectionEventHandler).toHaveBeenCalledWith(
            'error',
            expect.objectContaining({
                errorType: WebSocketErrorType.TIMEOUT_ERROR
            })
        );
    });

    it('should attempt reconnection after unexpected disconnection', async () => {
        // First connect successfully
        const connectPromise = controller.connect();
        const mockClient = (Client as jest.Mock).mock.results[0].value;
        mockClient.onConnect();
        await connectPromise;
        
        // Reset the mock to track new calls
        mockConnectionEventHandler.mockClear();
        
        // Simulate unexpected disconnection
        mockClient.onDisconnect();
        
        // Check that reconnection was scheduled
        expect(mockConnectionEventHandler).toHaveBeenCalledWith(
            'disconnect',
            expect.objectContaining({
                unexpected: true
            })
        );
        
        // Should schedule reconnection
        expect(mockConnectionEventHandler).toHaveBeenCalledWith(
            'reconnect',
            expect.any(Object)
        );
        
        // Advance timers to trigger reconnection attempt
        jest.advanceTimersByTime(1500); // More than the base reconnect delay
        
        // Should attempt to reconnect
        expect(mockClient.activate).toHaveBeenCalledTimes(2);
    });

    it('should implement exponential backoff for reconnection attempts', async () => {
        // Start connection
        const connectPromise = controller.connect().catch(() => {});
        
        // Simulate connection error
        const mockClient = (Client as jest.Mock).mock.results[0].value;
        const error = new Error('Connection failed');
        controller.handleError(error);
        
        // First reconnection attempt should be scheduled
        expect(mockConnectionEventHandler).toHaveBeenCalledWith(
            'reconnect',
            expect.any(Object)
        );
        
        // Advance timers for first attempt
        jest.advanceTimersByTime(1500);
        
        // Simulate second failure
        controller.handleError(error);
        
        // Get the delay from the second reconnect call
        const secondCallArgs = mockConnectionEventHandler.mock.calls.filter(
            call => call[0] === 'reconnect'
        )[1][1];
        
        // The second delay should be greater than the first (exponential backoff)
        expect(secondCallArgs.delay).toBeGreaterThan(1000);
    });

    it('should stop reconnection attempts after reaching maximum', async () => {
        // Start connection
        const connectPromise = controller.connect().catch(() => {});
        
        // Simulate multiple connection errors
        const error = new Error('Connection failed');
        
        // First error
        controller.handleError(error);
        jest.advanceTimersByTime(1500);
        
        // Second error
        controller.handleError(error);
        jest.advanceTimersByTime(3000);
        
        // Third error (should be the last attempt with maxConnectionAttempts=3)
        controller.handleError(error);
        
        // Reset mock to check final calls
        mockConnectionEventHandler.mockClear();
        
        // Advance timers one more time
        jest.advanceTimersByTime(6000);
        
        // Should not attempt another reconnection
        expect(mockConnectionEventHandler).not.toHaveBeenCalledWith(
            'reconnect',
            expect.any(Object)
        );
        
        // Should have received final error notification
        expect(mockConnectionEventHandler).toHaveBeenCalledWith(
            'error',
            expect.objectContaining({
                final: true
            })
        );
    });

    it('should clean up resources when disposed', async () => {
        // First connect
        const connectPromise = controller.connect();
        const mockClient = (Client as jest.Mock).mock.results[0].value;
        mockClient.onConnect();
        await connectPromise;
        
        // Set up spies
        const disconnectSpy = jest.spyOn(controller, 'disconnect');
        
        // Dispose the controller
        controller.dispose();
        
        // Should call disconnect
        expect(disconnectSpy).toHaveBeenCalled();
        
        // Client should be nullified
        expect((controller as any).stompClient).toBeNull();
        
        // State should be reset
        expect(controller.getState()).toEqual({
            messages: [],
            encoreInformation: null,
            hasEncored: false,
            viewers: 0
        });
    });

    it('should handle STOMP errors', async () => {
        // Start connection
        const connectPromise = controller.connect().catch(() => {});
        
        // Simulate STOMP error
        const mockClient = (Client as jest.Mock).mock.results[0].value;
        const frame = { headers: { message: 'STOMP protocol error' } };
        mockClient.onStompError(frame);
        
        // Should trigger error event with STOMP error type
        expect(mockConnectionEventHandler).toHaveBeenCalledWith(
            'error',
            expect.objectContaining({
                errorType: WebSocketErrorType.STOMP_ERROR,
                metadata: expect.objectContaining({
                    frame
                })
            })
        );
    });

    it('should properly clean up subscriptions on disconnect', async () => {
        // First connect
        const connectPromise = controller.connect();
        const mockClient = (Client as jest.Mock).mock.results[0].value;
        
        // Create mock subscriptions
        const mockSubscriptions: Record<string, any> = {};
        const subscriptionTopics = ['/encore', '/chat/messages', '/chat/viewers'];
        
        subscriptionTopics.forEach(topic => {
            const mockUnsubscribe = jest.fn();
            mockSubscriptions[topic] = { unsubscribe: mockUnsubscribe };
            
            // Mock the subscribe method to return our mock subscription
            mockClient.subscribe.mockImplementationOnce(() => mockSubscriptions[topic]);
        });
        
        // Complete connection
        mockClient.onConnect();
        await connectPromise;
        
        // Now disconnect
        await controller.disconnect();
        
        // Check that each subscription was unsubscribed
        subscriptionTopics.forEach(topic => {
            const mockSubscription = mockSubscriptions[topic];
            expect(mockSubscription.unsubscribe).toHaveBeenCalled();
        });
    });
});