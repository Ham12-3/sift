import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { ChatSession, ChatSessionDocument } from './chat-session.schema';
import { ChatMessage, ChatMessageDocument } from './chat-message.schema';
import { CreateSessionDto, SendMessageDto } from './dto/chat.dto';
import { ProjectsService } from '../projects/projects.service';
import { FilesService } from '../files/files.service';
import { ProvidersService } from '../providers/providers.service';
import { AiClientService, ChatMessage as LlmMessage } from '../ai/ai-client.service';
import { buildChatContext, selectRelevantFiles } from './retrieval';

// How many prior turns to replay to the model for conversational continuity.
const HISTORY_TURNS = 8;

@Injectable()
export class ChatService {
  constructor(
    @InjectModel(ChatSession.name) private readonly sessionModel: Model<ChatSessionDocument>,
    @InjectModel(ChatMessage.name) private readonly messageModel: Model<ChatMessageDocument>,
    private readonly projects: ProjectsService,
    private readonly files: FilesService,
    private readonly providers: ProvidersService,
    private readonly ai: AiClientService,
  ) {}

  async createSession(
    userId: string,
    projectId: string,
    dto: CreateSessionDto,
  ): Promise<ChatSessionDocument> {
    await this.projects.getOwned(userId, projectId);
    return this.sessionModel.create({
      project: new Types.ObjectId(projectId),
      owner: new Types.ObjectId(userId),
      title: dto.title?.trim() || 'New conversation',
    });
  }

  async listSessions(userId: string, projectId: string): Promise<ChatSessionDocument[]> {
    await this.projects.getOwned(userId, projectId);
    return this.sessionModel
      .find({ project: new Types.ObjectId(projectId), owner: new Types.ObjectId(userId) })
      .sort({ updatedAt: -1 })
      .exec();
  }

  async getMessages(userId: string, sessionId: string): Promise<ChatMessageDocument[]> {
    const session = await this.getOwnedSession(userId, sessionId);
    return this.messageModel.find({ session: session._id }).sort({ createdAt: 1 }).exec();
  }

  /** Core RAG turn: retrieve context → call model → persist both messages. */
  async sendMessage(
    userId: string,
    sessionId: string,
    dto: SendMessageDto,
  ): Promise<{ user: ChatMessageDocument; assistant: ChatMessageDocument }> {
    const session = await this.getOwnedSession(userId, sessionId);
    const projectId = session.project.toString();
    const config = await this.providers.resolveConfig(userId, dto.providerId);

    // 1. Retrieve relevant code for this question.
    const allFiles = await this.files.getFilesForContext(projectId);
    const relevant = selectRelevantFiles(dto.content, allFiles);
    const context = buildChatContext(relevant);

    // 2. Replay recent history for continuity.
    const history = await this.messageModel
      .find({ session: session._id })
      .sort({ createdAt: -1 })
      .limit(HISTORY_TURNS)
      .exec();
    const priorTurns: LlmMessage[] = history
      .reverse()
      .map((m) => ({ role: m.role, content: m.content }));

    const systemPrompt = [
      'You are Sift, a helpful assistant that answers questions about a specific codebase.',
      'Use the provided code context to ground your answers. Cite file paths when relevant.',
      'If the answer is not in the provided files, say so plainly instead of guessing.',
      '',
      'CODE CONTEXT:',
      context || '(no files uploaded yet)',
    ].join('\n');

    // 3. Persist the user's message first so it survives an AI failure.
    const userMessage = await this.messageModel.create({
      session: session._id,
      project: session.project,
      role: 'user',
      content: dto.content,
    });

    const answer = await this.ai.complete(config, [
      { role: 'system', content: systemPrompt },
      ...priorTurns,
      { role: 'user', content: dto.content },
    ]);

    const assistantMessage = await this.messageModel.create({
      session: session._id,
      project: session.project,
      role: 'assistant',
      content: answer || '(the model returned an empty response)',
      citedFiles: relevant.map((f) => f.path),
    });

    // Title a fresh session from its first question; bump updatedAt either way.
    if (session.title === 'New conversation') {
      session.title = dto.content.slice(0, 60);
    }
    await session.save();

    return { user: userMessage, assistant: assistantMessage };
  }

  private async getOwnedSession(userId: string, sessionId: string): Promise<ChatSessionDocument> {
    if (!Types.ObjectId.isValid(sessionId)) throw new NotFoundException('Conversation not found');
    const session = await this.sessionModel.findById(sessionId).exec();
    if (!session || session.owner.toString() !== userId) {
      throw new NotFoundException('Conversation not found');
    }
    return session;
  }
}
