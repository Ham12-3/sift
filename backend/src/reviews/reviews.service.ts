import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import {
  Review,
  ReviewDocument,
  ReviewIssue,
  ReviewScope,
  Severity,
} from './review.schema';
import { CreateReviewDto } from './dto/review.dto';
import { ProjectsService } from '../projects/projects.service';
import { FilesService } from '../files/files.service';
import { ProvidersService } from '../providers/providers.service';
import { AiClientService } from '../ai/ai-client.service';
import { buildSystemPrompt, buildUserPrompt } from './prompts';

const SEVERITIES: Severity[] = ['critical', 'high', 'medium', 'low'];

@Injectable()
export class ReviewsService {
  constructor(
    @InjectModel(Review.name) private readonly reviewModel: Model<ReviewDocument>,
    private readonly projects: ProjectsService,
    private readonly files: FilesService,
    private readonly providers: ProvidersService,
    private readonly ai: AiClientService,
  ) {}

  async create(userId: string, projectId: string, dto: CreateReviewDto): Promise<ReviewDocument> {
    await this.projects.getOwned(userId, projectId);

    const targetPaths = dto.paths ?? [];
    const scope: ReviewScope =
      targetPaths.length === 0 ? 'project' : targetPaths.length === 1 ? 'file' : 'files';

    const contextFiles = await this.files.getFilesForContext(
      projectId,
      targetPaths.length ? targetPaths : undefined,
    );
    if (!contextFiles.length) {
      throw new BadRequestException('No files available to review. Upload code first.');
    }

    const config = await this.providers.resolveConfig(userId, dto.providerId);

    const review = await this.reviewModel.create({
      project: new Types.ObjectId(projectId),
      owner: new Types.ObjectId(userId),
      template: dto.template,
      scope,
      targetPaths: contextFiles.map((f) => f.path),
      status: 'pending',
      model: config.model,
    });

    try {
      const raw = await this.ai.complete(
        config,
        [
          { role: 'system', content: buildSystemPrompt(dto.template) },
          { role: 'user', content: buildUserPrompt(contextFiles) },
        ],
        { json: true, maxTokens: 4000 },
      );
      const parsed = parseReviewJson(raw);
      const issues = normalizeIssues(parsed.issues);
      const counts = countSeverities(issues);

      review.summary = parsed.summary;
      review.issues = issues;
      review.recommendations = parsed.recommendations;
      review.severityCounts = counts;
      review.topSeverity = topSeverity(counts);
      review.status = 'completed';
      await review.save();
    } catch (err) {
      review.status = 'failed';
      review.error = err instanceof Error ? err.message : 'Review failed';
      await review.save();
      throw err;
    }
    return review;
  }

  async list(
    userId: string,
    projectId: string,
    search?: string,
  ): Promise<ReviewDocument[]> {
    await this.projects.getOwned(userId, projectId);
    const filter: Record<string, unknown> = { project: new Types.ObjectId(projectId) };
    if (search?.trim()) {
      // Case-insensitive substring match across summary + paths keeps search
      // intuitive without requiring exact text-index tokens.
      const rx = new RegExp(escapeRegex(search.trim()), 'i');
      filter.$or = [{ summary: rx }, { targetPaths: rx }, { template: rx }];
    }
    return this.reviewModel.find(filter).sort({ createdAt: -1 }).exec();
  }

  /** History across all of a user's projects (for the global history view). */
  async listForUser(userId: string, search?: string): Promise<ReviewDocument[]> {
    const filter: Record<string, unknown> = { owner: new Types.ObjectId(userId) };
    if (search?.trim()) {
      const rx = new RegExp(escapeRegex(search.trim()), 'i');
      filter.$or = [{ summary: rx }, { targetPaths: rx }, { template: rx }];
    }
    return this.reviewModel.find(filter).sort({ createdAt: -1 }).limit(200).exec();
  }

  async get(userId: string, reviewId: string): Promise<ReviewDocument> {
    if (!Types.ObjectId.isValid(reviewId)) throw new NotFoundException('Review not found');
    const review = await this.reviewModel.findById(reviewId).exec();
    if (!review || review.owner.toString() !== userId) {
      throw new NotFoundException('Review not found');
    }
    return review;
  }
}

// ── Parsing & aggregation helpers ──────────────────────

interface ParsedReview {
  summary: string;
  issues: unknown[];
  recommendations: string[];
}

/** Tolerant JSON extraction — strips code fences and isolates the JSON object. */
function parseReviewJson(raw: string): ParsedReview {
  let text = raw.trim();
  text = text.replace(/^```(?:json)?/i, '').replace(/```$/, '').trim();
  const start = text.indexOf('{');
  const end = text.lastIndexOf('}');
  if (start !== -1 && end !== -1) {
    text = text.slice(start, end + 1);
  }
  let obj: any;
  try {
    obj = JSON.parse(text);
  } catch {
    throw new BadRequestException(
      'The AI returned a response that could not be parsed as JSON. Try again or pick a more capable model.',
    );
  }
  return {
    summary: typeof obj.summary === 'string' ? obj.summary : '',
    issues: Array.isArray(obj.issues) ? obj.issues : [],
    recommendations: Array.isArray(obj.recommendations)
      ? obj.recommendations.filter((r: unknown) => typeof r === 'string')
      : [],
  };
}

function normalizeIssues(issues: unknown[]): ReviewIssue[] {
  return issues.map((i: any) => {
    const severity: Severity = SEVERITIES.includes(i?.severity) ? i.severity : 'low';
    const line =
      typeof i?.line === 'number' && Number.isFinite(i.line) ? Math.trunc(i.line) : null;
    return {
      title: String(i?.title ?? 'Untitled issue').slice(0, 300),
      description: String(i?.description ?? ''),
      severity,
      file: String(i?.file ?? ''),
      line,
      recommendation: String(i?.recommendation ?? ''),
    };
  });
}

function countSeverities(issues: ReviewIssue[]): Record<Severity, number> {
  const counts: Record<Severity, number> = { critical: 0, high: 0, medium: 0, low: 0 };
  for (const issue of issues) counts[issue.severity]++;
  return counts;
}

function topSeverity(counts: Record<Severity, number>): Severity | 'none' {
  for (const sev of SEVERITIES) {
    if (counts[sev] > 0) return sev;
  }
  return 'none';
}

function escapeRegex(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
