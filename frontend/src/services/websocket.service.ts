// import { io, Socket } from 'socket.io-client';
// import { getToken } from '../utils/token';

// const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

// class WebSocketService {
//   private meetingsSocket: Socket | null = null;
//   private webrtcSocket: Socket | null = null;

//   // Connect to meetings namespace
//   connectMeetings(): Socket {
//     if (this.meetingsSocket?.connected) {
//       return this.meetingsSocket;
//     }

//     const token = getToken();
    
//     this.meetingsSocket = io(`${API_URL.replace('/api', '')}/meetings`, {
//       auth: { token },
//       transports: ['websocket'],
//     });

//     this.meetingsSocket.on('connect', () => {
//       console.log('Connected to meetings namespace');
//     });

//     this.meetingsSocket.on('disconnect', () => {
//       console.log('Disconnected from meetings namespace');
//     });

//     this.meetingsSocket.on('error', (error: any) => {
//       console.error('Meetings socket error:', error);
//     });

//     return this.meetingsSocket;
//   }

//   // Connect to WebRTC signaling namespace
//   connectWebRTC(): Socket {
//     if (this.webrtcSocket?.connected) {
//       return this.webrtcSocket;
//     }

//     const token = getToken();
    
//     this.webrtcSocket = io(`${API_URL.replace('/api', '')}/webrtc`, {
//       auth: { token },
//       transports: ['websocket'],
//     });

//     this.webrtcSocket.on('connect', () => {
//       console.log('Connected to WebRTC namespace');
//     });

//     this.webrtcSocket.on('disconnect', () => {
//       console.log('Disconnected from WebRTC namespace');
//     });

//     this.webrtcSocket.on('error', (error: any) => {
//       console.error('WebRTC socket error:', error);
//     });

//     return this.webrtcSocket;
//   }

//   getMeetingsSocket(): Socket | null {
//     return this.meetingsSocket;
//   }

//   getWebRTCSocket(): Socket | null {
//     return this.webrtcSocket;
//   }

//   disconnectAll() {
//     if (this.meetingsSocket) {
//       this.meetingsSocket.disconnect();
//       this.meetingsSocket = null;
//     }
//     if (this.webrtcSocket) {
//       this.webrtcSocket.disconnect();
//       this.webrtcSocket = null;
//     }
//   }
// }

// // export default new WebSocketService();

// import { io, Socket } from 'socket.io-client';
// import { getToken } from '../utils/token';

// //const API_URL = import.meta.env.VITE_API_URL || 'https://api.khoiva.id.vn' || 'http://localhost:3000/api';
// const hostname = window.location.hostname;

// // Logic tự động chọn API URL
// const API_URL = import.meta.env.VITE_API_URL || (() => {
//   // Trường hợp 1: Đang chạy trên Domain thật (Production)
//   if (hostname === 'khoiva.id.vn') {
//     return 'https://api.khoiva.id.vn';
//   }
  
//   // Trường hợp 2: Đang chạy Localhost hoặc mạng LAN (192.168.x.x)
//   // Tự động ghép hostname hiện tại với cổng 3000
//   // Ví dụ: đang ở 192.168.0.105:5173 -> gọi API ở http://192.168.0.105:3000
//   return `http://${hostname}:3000/api`;
// })();

// class WebSocketService {
//   private meetingsSocket: Socket | null = null;
//   private webrtcSocket: Socket | null = null;
//   private reconnectAttempts = 0;
//   private maxReconnectAttempts = 5;

//   // Connect to meetings namespace
//   connectMeetings(): Socket {
//     if (this.meetingsSocket?.connected) {
//       console.log('✅ Meetings socket already connected');
//       return this.meetingsSocket;
//     }

//     const token = getToken();
//     if (!token) {
//       console.error('❌ No auth token found');
//       throw new Error('Authentication required');
//     }

//     console.log('🔌 Connecting to meetings namespace...');
    
//     this.meetingsSocket = io(`${API_URL.replace('/api', '')}/meetings`, {
//       auth: { token },
//       transports: ['websocket', 'polling'],
//       reconnection: true,
//       reconnectionDelay: 1000,
//       reconnectionAttempts: this.maxReconnectAttempts,
//       timeout: 10000,
//     });

//     this.meetingsSocket.on('connect', () => {
//       console.log('✅ Connected to meetings namespace');
//       this.reconnectAttempts = 0;
//     });

//     this.meetingsSocket.on('disconnect', (reason) => {
//       console.log('❌ Disconnected from meetings namespace:', reason);
//     });

//     this.meetingsSocket.on('connect_error', (error) => {
//       console.error('❌ Meetings connection error:', error.message);
//       this.reconnectAttempts++;
      
//       if (this.reconnectAttempts >= this.maxReconnectAttempts) {
//         console.error('❌ Max reconnection attempts reached');
//       }
//     });

//     this.meetingsSocket.on('error', (error: any) => {
//       console.error('❌ Meetings socket error:', error);
//     });

//     return this.meetingsSocket;
//   }

//   // Connect to WebRTC signaling namespace
//   connectWebRTC(): Socket {
//     if (this.webrtcSocket?.connected) {
//       console.log('✅ WebRTC socket already connected');
//       return this.webrtcSocket;
//     }

//     const token = getToken();
//     if (!token) {
//       console.error('❌ No auth token found');
//       throw new Error('Authentication required');
//     }

//     console.log('🔌 Connecting to WebRTC namespace...');
    
//     this.webrtcSocket = io(`${API_URL.replace('/api', '')}/webrtc`, {
//       auth: { token },
//       transports: ['websocket', 'polling'],
//       reconnection: true,
//       reconnectionDelay: 1000,
//       reconnectionAttempts: this.maxReconnectAttempts,
//       timeout: 10000,
//     });

//     this.webrtcSocket.on('connect', () => {
//       console.log('✅ Connected to WebRTC namespace');
//       this.reconnectAttempts = 0;
//     });

//     this.webrtcSocket.on('disconnect', (reason) => {
//       console.log('❌ Disconnected from WebRTC namespace:', reason);
//     });

//     this.webrtcSocket.on('connect_error', (error) => {
//       console.error('❌ WebRTC connection error:', error.message);
//       this.reconnectAttempts++;
//     });

//     this.webrtcSocket.on('error', (error: any) => {
//       console.error('❌ WebRTC socket error:', error);
//     });

//     return this.webrtcSocket;
//   }

//   getMeetingsSocket(): Socket | null {
//     return this.meetingsSocket;
//   }

//   getWebRTCSocket(): Socket | null {
//     return this.webrtcSocket;
//   }

//   // Check if sockets are connected
//   isConnected(): boolean {
//     return (
//       this.meetingsSocket?.connected === true &&
//       this.webrtcSocket?.connected === true
//     );
//   }

//   // Disconnect all sockets
//   disconnectAll() {
//     console.log('🔌 Disconnecting all sockets...');
    
//     if (this.meetingsSocket) {
//       this.meetingsSocket.disconnect();
//       this.meetingsSocket = null;
//     }
    
//     if (this.webrtcSocket) {
//       this.webrtcSocket.disconnect();
//       this.webrtcSocket = null;
//     }
    
//     console.log('All sockets disconnected');
//   }
// }

// export default new WebSocketService();

import { io, Socket } from 'socket.io-client';
import { getToken } from '../utils/token';

// --- PHẦN SỬA LỖI QUAN TRỌNG ---
const getBaseUrl = () => {
  // Nếu có biến môi trường thì ưu tiên dùng
  if (import.meta.env.VITE_API_URL) {
    return import.meta.env.VITE_API_URL;
  }

  const hostname = window.location.hostname;
  const protocol = window.location.protocol;

  // Nếu đang chạy HTTPS (Cloudflare Tunnel, VPS, Production...)
  // THÌ KHÔNG ĐƯỢC THÊM PORT 3000
  if (protocol === 'https:') {
    return 'https://' + hostname; 
    // Kết quả: https://meeting-app.trycloudflare.com
  }

  // Nếu đang chạy HTTP (thường là Localhost dev)
  // Thì trỏ về port 3000 của backend
  return `http://${hostname}:3000`;
};

const BASE_URL = getBaseUrl();
console.log('🔗 WebSocket connecting to:', BASE_URL); // Debug xem nó ra link gì
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
    
    // SỬA: Cách nối chuỗi URL an toàn hơn
    // Nếu BASE_URL là https://domain.com -> kết nối vào https://domain.com/meetings
    this.meetingsSocket = io(`${BASE_URL}/meetings`, {
      auth: { token },
      transports: ['websocket'], // Chỉ dùng websocket để ổn định qua Tunnel
      path: '/socket.io', // Đảm bảo trùng path với NestJS
      reconnection: true,
      secure: true, // Bắt buộc dùng Secure connection cho HTTPS
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
    
    // SỬA: Tương tự như trên
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