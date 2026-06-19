import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type ReviewDocument = HydratedDocument<Review>;
export type ReviewTemplate = 'security' | 'performance' | 'quality';
export type Severity = 'critical' | 'high' | 'medium' | 'low';
export type ReviewScope = 'file' | 'files' | 'project';
export type ReviewStatus = 'pending' | 'completed' | 'failed';

@Schema({ _id: false })
export class ReviewIssue {
  @Prop({ required: true })
  title: string;

  @Prop({ default: '' })
  description: string;

  @Prop({ required: true, enum: ['critical', 'high', 'medium', 'low'] })
  severity: Severity;

  /** File this issue refers to (may be empty for project-wide observations). */
  @Prop({ default: '' })
  file: string;

  @Prop({ default: null, type: Number })
  line: number | null;

  @Prop({ default: '' })
  recommendation: string;
}
const ReviewIssueSchema = SchemaFactory.createForClass(ReviewIssue);

@Schema({ timestamps: true })
export class Review {
  @Prop({ type: Types.ObjectId, ref: 'Project', required: true, index: true })
  project: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true, index: true })
  owner: Types.ObjectId;

  @Prop({ required: true, enum: ['security', 'performance', 'quality'] })
  template: ReviewTemplate;

  @Prop({ required: true, enum: ['file', 'files', 'project'] })
  scope: ReviewScope;

  /** Paths that were reviewed. */
  @Prop({ type: [String], default: [] })
  targetPaths: string[];

  @Prop({ enum: ['pending', 'completed', 'failed'], default: 'pending' })
  status: ReviewStatus;

  @Prop({ default: '' })
  summary: string;

  @Prop({ type: [ReviewIssueSchema], default: [] })
  issues: ReviewIssue[];

  @Prop({ type: [String], default: [] })
  recommendations: string[];

  /** Highest severity present, for at-a-glance history badges. */
  @Prop({ enum: ['critical', 'high', 'medium', 'low', 'none'], default: 'none' })
  topSeverity: Severity | 'none';

  /** Per-severity counts, denormalized for the history list. */
  @Prop({ type: Object, default: {} })
  severityCounts: Record<Severity, number>;

  /** Model identifier used to produce the review (audit trail). */
  @Prop({ default: '' })
  model: string;

  /** Populated when status is "failed". */
  @Prop({ default: '' })
  error: string;
}

export const ReviewSchema = SchemaFactory.createForClass(Review);
// Text index powers history search across summaries and target paths.
ReviewSchema.index({ summary: 'text', targetPaths: 'text' });
