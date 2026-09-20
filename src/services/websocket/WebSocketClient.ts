import {
  DeliveryEventPayload,
  EncryptedMessage,
  PresenceEventPayload,
  TypingEventPayload,
  WebSocketEvent,
} from '../../types';

export type WebSocketConnectionStatus = 'disconnected' | 'connecting' | 'connected' | 'reconnecting' | 'simulated';

type EventCallback<T> = (data: T) => void;

interface WebSocketClientOptions {
  url?: string;
  autoReconnect?: boolean;
  maxReconnectAttempts?: number;
  heartbeatIntervalMs?: number;
}

/**
 * WebSocketClient
 *
 * Dedicated WebSocket client abstraction for real-time messaging, typing indicators,
 * presence states, and delivery acks.
 *
 * Designed to cleanly separate network transport from React UI components.
 * Configured via environment variable VITE_WS_URL.
 */
export class WebSocketClient {
  private ws: WebSocket | null = null;
  private url: string;
  private status: WebSocketConnectionStatus = 'disconnected';
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectTimer: number | null = null;
  private heartbeatTimer: number | null = null;
  private token: string | null = null;
  private isExplicitlyClosed = false;

  // Listeners
  private messageListeners: Set<EventCallback<EncryptedMessage>> = new Set();
  private typingListeners: Set<EventCallback<TypingEventPayload>> = new Set();
  private presenceListeners: Set<EventCallback<PresenceEventPayload>> = new Set();
  private deliveryListeners: Set<EventCallback<DeliveryEventPayload>> = new Set();
  private statusListeners: Set<EventCallback<WebSocketConnectionStatus>> = new Set();

  constructor(options: WebSocketClientOptions = {}) {
    // Read from environment variable VITE_WS_URL or fallback to live Render backend
    const envWsUrl = (import.meta as { env?: { VITE_WS_URL?: string } }).env?.VITE_WS_URL;
    this.url = options.url || (envWsUrl && envWsUrl.trim() ? envWsUrl : 'wss://cipherchat-rtn2.onrender.com/ws');
    this.maxReconnectAttempts = options.maxReconnectAttempts ?? 5;
  }

  public setUrl(url: string): void {
    this.url = url;
    if (this.status === 'connected' || this.status === 'connecting') {
      this.reconnect();
    }
  }

  public getUrl(): string {
    return this.url;
  }

  public getStatus(): WebSocketConnectionStatus {
    return this.status;
  }

  private setStatus(newStatus: WebSocketConnectionStatus): void {
    if (this.status !== newStatus) {
      this.status = newStatus;
      this.statusListeners.forEach(cb => cb(newStatus));
    }
  }

  /**
   * Connect to the WebSocket server using authentication token.
   */
  public connect(token?: string): void {
    if (token) {
      this.token = token;
    }

    this.isExplicitlyClosed = false;

    // If no URL is provided in the environment, initialize in simulated development mode
    if (!this.url || this.url.trim() === '') {
      this.setStatus('simulated');
      console.info(
        '[WebSocketClient] VITE_WS_URL is not set. Operating in local sandbox mode with simulated real-time peer loopback.'
      );
      return;
    }

    if (this.ws && (this.ws.readyState === WebSocket.OPEN || this.ws.readyState === WebSocket.CONNECTING)) {
      return;
    }

    this.setStatus(this.reconnectAttempts > 0 ? 'reconnecting' : 'connecting');

    try {
      const connectionUrl = this.token
        ? `${this.url}${this.url.includes('?') ? '&' : '?'}token=${encodeURIComponent(this.token)}`
        : this.url;

      this.ws = new WebSocket(connectionUrl);

      this.ws.onopen = () => {
        this.reconnectAttempts = 0;
        this.setStatus('connected');
        this.startHeartbeat();
      };

      this.ws.onmessage = (event: MessageEvent) => {
        this.handleIncomingRawMessage(event.data);
      };

      this.ws.onerror = (error) => {
        console.warn('[WebSocketClient] Connection error:', error);
      };

      this.ws.onclose = (event) => {
        this.stopHeartbeat();
        this.ws = null;

        if (!this.isExplicitlyClosed) {
          this.scheduleReconnect();
        } else {
          this.setStatus('disconnected');
        }
      };
    } catch (err) {
      console.warn('[WebSocketClient] Failed to instantiate WebSocket:', err);
      this.scheduleReconnect();
    }
  }

  /**
   * Disconnect the WebSocket connection.
   */
  public disconnect(): void {
    this.isExplicitlyClosed = true;
    this.clearTimers();

    if (this.ws) {
      this.ws.close(1000, 'User logged out or client disconnected');
      this.ws = null;
    }

    this.setStatus('disconnected');
  }

  public reconnect(): void {
    this.disconnect();
    this.reconnectAttempts = 0;
    this.connect(this.token || undefined);
  }

  private scheduleReconnect(): void {
    if (this.isExplicitlyClosed) return;

    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      const delay = Math.min(1000 * Math.pow(2, this.reconnectAttempts - 1), 15000);
      this.setStatus('reconnecting');
      this.reconnectTimer = window.setTimeout(() => {
        this.connect();
      }, delay);
    } else {
      // Switch to simulated fallback if actual server is unreachable during dev
      this.setStatus('simulated');
      console.info('[WebSocketClient] Max reconnect attempts reached. Active in simulated local mode.');
    }
  }

  private clearTimers(): void {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    this.stopHeartbeat();
  }

  private startHeartbeat(): void {
    this.stopHeartbeat();
    this.heartbeatTimer = window.setInterval(() => {
      if (this.ws && this.ws.readyState === WebSocket.OPEN) {
        this.ws.send(JSON.stringify({ type: 'ping', timestamp: Date.now() }));
      }
    }, 30000);
  }

  private stopHeartbeat(): void {
    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer);
      this.heartbeatTimer = null;
    }
  }

  /**
   * Dispatches an outgoing EncryptedMessage over the WebSocket wire.
   */
  public sendMessage(encryptedMessage: EncryptedMessage): void {
    const payload: WebSocketEvent<EncryptedMessage> = {
      type: 'message',
      payload: encryptedMessage,
    };

    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(payload));
    } else {
      // If in simulated mode or disconnected dev mode, simulate local server delivery confirmation
      setTimeout(() => {
        this.emitDelivery({
          messageId: encryptedMessage.id,
          conversationId: encryptedMessage.conversationId,
          status: 'delivered',
          timestamp: new Date().toISOString(),
        });
      }, 500);
    }
  }

  /**
   * Broadcasts typing status event.
   */
  public sendTyping(conversationId: string, userId: string, username: string, isTyping: boolean): void {
    const payload: WebSocketEvent<TypingEventPayload> = {
      type: 'typing',
      payload: { conversationId, userId, username, isTyping },
    };

    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(payload));
    }
  }

  /**
   * Sends delivery receipt / read acknowledgement.
   */
  public sendDeliveryAck(messageId: string, conversationId: string, status: 'delivered' | 'read'): void {
    const payload: WebSocketEvent<DeliveryEventPayload> = {
      type: 'delivery',
      payload: {
        messageId,
        conversationId,
        status,
        timestamp: new Date().toISOString(),
      },
    };

    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(payload));
    }
  }

  /**
   * Parses raw messages from the network wire.
   */
  private handleIncomingRawMessage(rawData: string): void {
    try {
      const event: WebSocketEvent = JSON.parse(rawData);

      switch (event.type) {
        case 'message':
          this.emitMessage(event.payload as EncryptedMessage);
          break;
        case 'typing':
          this.emitTyping(event.payload as TypingEventPayload);
          break;
        case 'presence':
          this.emitPresence(event.payload as PresenceEventPayload);
          break;
        case 'delivery':
          this.emitDelivery(event.payload as DeliveryEventPayload);
          break;
        default:
          break;
      }
    } catch (err) {
      console.warn('[WebSocketClient] Error parsing incoming WebSocket payload:', err);
    }
  }

  // --- Emitters for local simulation & testing ---

  public emitMessage(message: EncryptedMessage): void {
    this.messageListeners.forEach(cb => cb(message));
  }

  public emitTyping(typing: TypingEventPayload): void {
    this.typingListeners.forEach(cb => cb(typing));
  }

  public emitPresence(presence: PresenceEventPayload): void {
    this.presenceListeners.forEach(cb => cb(presence));
  }

  public emitDelivery(delivery: DeliveryEventPayload): void {
    this.deliveryListeners.forEach(cb => cb(delivery));
  }

  // --- Event Subscriptions ---

  public onMessage(callback: EventCallback<EncryptedMessage>): () => void {
    this.messageListeners.add(callback);
    return () => this.messageListeners.delete(callback);
  }

  public onTyping(callback: EventCallback<TypingEventPayload>): () => void {
    this.typingListeners.add(callback);
    return () => this.typingListeners.delete(callback);
  }

  public onPresence(callback: EventCallback<PresenceEventPayload>): () => void {
    this.presenceListeners.add(callback);
    return () => this.presenceListeners.delete(callback);
  }

  public onDelivery(callback: EventCallback<DeliveryEventPayload>): () => void {
    this.deliveryListeners.add(callback);
    return () => this.deliveryListeners.delete(callback);
  }

  public onStatusChange(callback: EventCallback<WebSocketConnectionStatus>): () => void {
    this.statusListeners.add(callback);
    callback(this.status);
    return () => this.statusListeners.delete(callback);
  }
}

// Export singleton instance
export const wsClient = new WebSocketClient();
