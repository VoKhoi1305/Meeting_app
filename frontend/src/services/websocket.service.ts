import { io, Socket } from 'socket.io-client';
import { getToken } from '../utils/token';

const getBaseUrl = () => {
  const hostname = window.location.hostname;
  if (hostname === 'khoiva.id.vn') {
    return 'https://api.khoiva.id.vn';
  }
  return `http://${hostname}:3000`;
};

const BASE_URL = getBaseUrl();

class WebSocketService {
  private meetingsSocket: Socket | null = null;
  private webrtcSocket: Socket | null = null;

  connectMeetings(): Socket {
    if (this.meetingsSocket) {
        if (!this.meetingsSocket.connected) {
            this.meetingsSocket.connect();
        }
        return this.meetingsSocket;
    }

    const token = getToken();
    if (!token) return null as any;

    this.meetingsSocket = io(`${BASE_URL}/meetings`, {
      auth: { token },
      transports: ['polling', 'websocket'], 
      path: '/socket.io',
      reconnection: true,
      reconnectionAttempts: 10,
      autoConnect: true,
    });

    return this.meetingsSocket;
  }

  connectWebRTC(): Socket {
    if (this.webrtcSocket) {
        if (!this.webrtcSocket.connected) {
            this.webrtcSocket.connect();
        }
        return this.webrtcSocket;
    }

    const token = getToken();
    if (!token) return null as any;

    this.webrtcSocket = io(`${BASE_URL}/webrtc`, {
      auth: { token },
      transports: ['polling', 'websocket'],
      path: '/socket.io',
      reconnection: true,
      reconnectionAttempts: 10,
      autoConnect: true,
    });

    return this.webrtcSocket;
  }

  getMeetingsSocket() { return this.meetingsSocket; }
  getWebRTCSocket() { return this.webrtcSocket; }

  disconnectAll() {
    this.meetingsSocket?.disconnect();
    this.webrtcSocket?.disconnect();
    this.meetingsSocket = null;
    this.webrtcSocket = null;
  }
}

export default new WebSocketService();