import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type ChatMessageDocument = HydratedDocument<ChatMessage>;

@Schema({ timestamps: true })
export class ChatMessage {
  @Prop({ type: Types.ObjectId, ref: 'ChatSession', required: true, index: true })
  session: Types.ObjectId;

  /** Denormalized for cascade deletes when a project is removed. */
  @Prop({ type: Types.ObjectId, ref: 'Project', required: true, index: true })
  project: Types.ObjectId;

  @Prop({ required: true, enum: ['user', 'assistant'] })
  role: 'user' | 'assistant';

  @Prop({ required: true })
  content: string;

  /** File paths the assistant used as context for this answer. */
  @Prop({ type: [String], default: [] })
  citedFiles: string[];
}

export const ChatMessageSchema = SchemaFactory.createForClass(ChatMessage);
