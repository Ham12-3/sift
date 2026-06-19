import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Project, ProjectSchema } from './project.schema';
import { CodeFile, CodeFileSchema } from '../files/file.schema';
import { Review, ReviewSchema } from '../reviews/review.schema';
import { ChatSession, ChatSessionSchema } from '../chat/chat-session.schema';
import { ChatMessage, ChatMessageSchema } from '../chat/chat-message.schema';
import { ProjectsService } from './projects.service';
import { ProjectsController } from './projects.controller';

@Module({
  imports: [
    // The project schema plus everything ProjectsService cascade-deletes.
    MongooseModule.forFeature([
      { name: Project.name, schema: ProjectSchema },
      { name: CodeFile.name, schema: CodeFileSchema },
      { name: Review.name, schema: ReviewSchema },
      { name: ChatSession.name, schema: ChatSessionSchema },
      { name: ChatMessage.name, schema: ChatMessageSchema },
    ]),
  ],
  controllers: [ProjectsController],
  providers: [ProjectsService],
  exports: [ProjectsService],
})
export class ProjectsModule {}
