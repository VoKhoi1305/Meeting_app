
import { io, Socket } from 'socket.io-client';
import { getToken } from '../utils/token';


const getBaseUrl = () => {
  const hostname = window.location.hostname;

  // Nếu đang chạy trên domain thật (Cloudflare)
  if (hostname === 'khoiva.id.vn') {
    return 'https://api.khoiva.id.vn'; // Trả về đúng domain, KHÔNG nối thêm gì cả
  }
  
  // Nếu đang chạy localhost
  return `http://${hostname}:3000`;
};

const BASE_URL = getBaseUrl();
// -------------------------------

class WebSocketService {
  private meetingsSocket: Socket | null = null;
  private webrtcSocket: Socket | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;

  // Connect to meetings namespace
  connectMeetings(): Socket {
    if (this.meetingsSocket?.connected) {
      return this.meetingsSocket;
    }

    const token = getToken();
    
    this.meetingsSocket = io(`${BASE_URL}/meetings`, {
      auth: { token },
      transports: ['websocket'], 
      path: '/socket.io', 
      reconnection: true,
      secure: true, 
    });


    this.meetingsSocket.on('connect', () => {
      console.log('✅ Connected to meetings namespace');
      this.reconnectAttempts = 0;
    });

    this.meetingsSocket.on('connect_error', (error) => {
      console.error('❌ Meetings connection error:', error.message);
    });

    return this.meetingsSocket;
  }

  // Connect to WebRTC signaling namespace
  connectWebRTC(): Socket {
    if (this.webrtcSocket?.connected) {
      return this.webrtcSocket;
    }

    const token = getToken();
    
    this.webrtcSocket = io(`${BASE_URL}/webrtc`, {
      auth: { token },
      transports: ['websocket'],
      path: '/socket.io',
      reconnection: true,
      secure: true,
    });

    this.webrtcSocket.on('connect', () => {
      console.log('✅ Connected to WebRTC namespace');
    });

    this.webrtcSocket.on('connect_error', (error) => {
      console.error('❌ WebRTC connection error:', error.message);
    });

    return this.webrtcSocket;
  }

  getMeetingsSocket(): Socket | null {
    return this.meetingsSocket;
  }

  getWebRTCSocket(): Socket | null {
    return this.webrtcSocket;
  }

  disconnectAll() {
    if (this.meetingsSocket) {
      this.meetingsSocket.disconnect();
      this.meetingsSocket = null;
    }
    if (this.webrtcSocket) {
      this.webrtcSocket.disconnect();
      this.webrtcSocket = null;
    }
  }
}

export default new WebSocketService();