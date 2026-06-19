import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser, AuthUser } from '../common/decorators/current-user.decorator';
import { ChatService } from './chat.service';
import { CreateSessionDto, SendMessageDto } from './dto/chat.dto';
import { ChatSessionDocument } from './chat-session.schema';
import { ChatMessageDocument } from './chat-message.schema';

function serializeSession(s: ChatSessionDocument) {
  return {
    id: s.id,
    project: s.project.toString(),
    title: s.title,
    createdAt: (s as any).createdAt,
    updatedAt: (s as any).updatedAt,
  };
}

function serializeMessage(m: ChatMessageDocument) {
  return {
    id: m.id,
    role: m.role,
    content: m.content,
    citedFiles: m.citedFiles,
    createdAt: (m as any).createdAt,
  };
}

@Controller()
@UseGuards(JwtAuthGuard)
export class ChatController {
  constructor(private readonly chat: ChatService) {}

  @Post('projects/:projectId/chat/sessions')
  async createSession(
    @CurrentUser() user: AuthUser,
    @Param('projectId') projectId: string,
    @Body() dto: CreateSessionDto,
  ) {
    return serializeSession(await this.chat.createSession(user.userId, projectId, dto));
  }

  @Get('projects/:projectId/chat/sessions')
  async listSessions(@CurrentUser() user: AuthUser, @Param('projectId') projectId: string) {
    const sessions = await this.chat.listSessions(user.userId, projectId);
    return sessions.map(serializeSession);
  }

  @Get('chat/sessions/:sessionId/messages')
  async messages(@CurrentUser() user: AuthUser, @Param('sessionId') sessionId: string) {
    const messages = await this.chat.getMessages(user.userId, sessionId);
    return messages.map(serializeMessage);
  }

  @Post('chat/sessions/:sessionId/messages')
  async send(
    @CurrentUser() user: AuthUser,
    @Param('sessionId') sessionId: string,
    @Body() dto: SendMessageDto,
  ) {
    const { user: u, assistant } = await this.chat.sendMessage(user.userId, sessionId, dto);
    return { user: serializeMessage(u), assistant: serializeMessage(assistant) };
  }
}
