import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
  ConnectedSocket,
  MessageBody,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';

@WebSocketGateway({
  cors: {
    origin: true,
    methods: ['GET', 'POST'],
    credentials: true,
  },
  namespace: 'webrtc',
})
export class WebRTCGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server; // <-- Đây là server của namespace /webrtc

  private logger = new Logger('WebRTCGateway');

  constructor(private readonly jwtService: JwtService) {}

  async handleConnection(client: Socket) {
    try {
      const token =
        client.handshake.auth.token || client.handshake.headers.authorization;

      if (!token) {
        this.logger.warn(`Client ${client.id} missing token`);
        client.disconnect();
        return;
      }

      const cleanToken = token.replace('Bearer ', '');
      const payload = this.jwtService.verify(cleanToken);
      client.data.user = payload;

      this.logger.log(
        `✅ WebRTC Client connected: ${client.id} (${payload.email})`,
      );
    } catch (error) {
      this.logger.error(`Connection unauthorized: ${error.message}`);
      client.disconnect();
    }
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`WebRTC Client disconnected: ${client.id}`);
  }

  @SubscribeMessage('join-room')
async handleJoinRoom(
  @ConnectedSocket() client: Socket,
  @MessageBody() data: { roomId: string },
) {
  if (!client.data.user) {
    client.disconnect();
    return;
  }

  const { roomId } = data;
  client.join(roomId);

  const sockets = await this.server.in(roomId).allSockets();
  const participants = [...sockets].filter(id => id !== client.id);

  client.emit('existing-participants', {
    participants: participants.map((id) => ({ peerId: id })),
  });

  client.to(roomId).emit('new-participant', {
    peerId: client.id,
  });

  this.logger.log(
    `User ${client.data.user.email} (${client.id}) joined WebRTC room ${roomId}`,
  );
}

  @SubscribeMessage('offer')
  handleOffer(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { target: string; offer: any; roomId: string },
  ) {
    this.server.to(data.target).emit('offer', {
      sender: client.id,
      offer: data.offer,
    });
  }

  @SubscribeMessage('answer')
  handleAnswer(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { target: string; answer: any },
  ) {
    this.server.to(data.target).emit('answer', {
      sender: client.id,
      answer: data.answer,
    });
  }

  @SubscribeMessage('ice-candidate')
  handleIceCandidate(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { target: string; candidate: any },
  ) {
    this.server.to(data.target).emit('ice-candidate', {
      sender: client.id,
      candidate: data.candidate,
    });
  }
}
