import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ChatSession, ChatSessionSchema } from './chat-session.schema';
import { ChatMessage, ChatMessageSchema } from './chat-message.schema';
import { ChatService } from './chat.service';
import { ChatController } from './chat.controller';
import { ProjectsModule } from '../projects/projects.module';
import { FilesModule } from '../files/files.module';
import { ProvidersModule } from '../providers/providers.module';
import { AiModule } from '../ai/ai.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: ChatSession.name, schema: ChatSessionSchema },
      { name: ChatMessage.name, schema: ChatMessageSchema },
    ]),
    ProjectsModule,
    FilesModule,
    ProvidersModule,
    AiModule,
  ],
  controllers: [ChatController],
  providers: [ChatService],
})
export class ChatModule {}
