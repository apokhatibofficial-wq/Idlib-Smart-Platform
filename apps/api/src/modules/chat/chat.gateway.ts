import { Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import {
  ConnectedSocket,
  MessageBody,
  OnGatewayConnection,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import type { Server, Socket } from 'socket.io';

interface WsTicketPayload {
  sub: string;
  purpose: 'ws';
}

interface AuthedSocket extends Socket {
  data: { userId?: string };
}

/**
 * Realtime chat delivery. Auth uses a short-lived one-time "ticket" (see
 * ChatController#wsTicket) instead of the httpOnly auth cookie, since raw
 * WebSocket handshakes cannot read httpOnly cookies from client JS and we do
 * not want to weaken the access-token cookie's httpOnly flag just for this.
 */
@WebSocketGateway({
  cors: { origin: true, credentials: true },
  namespace: '/ws/chat',
})
export class ChatGateway implements OnGatewayConnection {
  @WebSocketServer() server!: Server;
  private readonly logger = new Logger(ChatGateway.name);

  constructor(
    private readonly jwt: JwtService,
    private readonly config: ConfigService,
  ) {}

  handleConnection(client: AuthedSocket) {
    const ticket = client.handshake.auth?.ticket as string | undefined;
    try {
      if (!ticket) throw new Error('missing ticket');
      const payload = this.jwt.verify<WsTicketPayload>(ticket, {
        secret: this.config.get<string>('jwt.accessSecret'),
      });
      if (payload.purpose !== 'ws') throw new Error('invalid ticket purpose');
      client.data.userId = payload.sub;
    } catch {
      this.logger.warn(`Rejected unauthenticated WS connection ${client.id}`);
      client.disconnect(true);
    }
  }

  @SubscribeMessage('join')
  handleJoin(
    @ConnectedSocket() client: AuthedSocket,
    @MessageBody() data: { conversationId: string },
  ) {
    if (!client.data.userId || !data?.conversationId) return;
    void client.join(data.conversationId);
  }

  @SubscribeMessage('leave')
  handleLeave(@ConnectedSocket() client: Socket, @MessageBody() data: { conversationId: string }) {
    if (!data?.conversationId) return;
    void client.leave(data.conversationId);
  }

  emitMessage(conversationId: string, message: unknown) {
    this.server?.to(conversationId).emit('message', message);
  }
}
