import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type AiProviderDocument = HydratedDocument<AiProvider>;

@Schema({ timestamps: true })
export class AiProvider {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true, index: true })
  owner: Types.ObjectId;

  /** Friendly label, e.g. "OpenAI", "Local LM Studio". */
  @Prop({ required: true, trim: true })
  name: string;

  @Prop({ required: true, trim: true })
  baseUrl: string;

  // Stored as `modelName` because Mongoose reserves `Document.model`.
  // The API surface still calls this field "model".
  @Prop({ required: true, trim: true })
  modelName: string;

  /** Encrypted at rest (AES-256-GCM). Empty for keyless local servers. */
  @Prop({ default: '' })
  apiKeyEncrypted: string;

  /** Last 4 chars of the key for display, e.g. "••••abcd". */
  @Prop({ default: '' })
  apiKeyHint: string;

  /** Exactly one provider per user is the default used when none is specified. */
  @Prop({ default: false })
  isDefault: boolean;
}

export const AiProviderSchema = SchemaFactory.createForClass(AiProvider);
