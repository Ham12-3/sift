import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type CodeFileDocument = HydratedDocument<CodeFile>;

@Schema({ timestamps: true })
export class CodeFile {
  @Prop({ type: Types.ObjectId, ref: 'Project', required: true, index: true })
  project: Types.ObjectId;

  /** POSIX-style path relative to the project root, e.g. "src/app/main.ts". */
  @Prop({ required: true })
  path: string;

  /** Language hint derived from the extension, used for syntax highlighting. */
  @Prop({ default: 'plaintext' })
  language: string;

  @Prop({ default: 0 })
  size: number;

  /** UTF-8 text content. Binary files are skipped at ingestion time. */
  @Prop({ default: '' })
  content: string;
}

export const CodeFileSchema = SchemaFactory.createForClass(CodeFile);
// One row per (project, path); re-uploading a path overwrites it.
CodeFileSchema.index({ project: 1, path: 1 }, { unique: true });
