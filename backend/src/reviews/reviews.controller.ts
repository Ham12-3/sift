import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser, AuthUser } from '../common/decorators/current-user.decorator';
import { ReviewsService } from './reviews.service';
import { CreateReviewDto } from './dto/review.dto';
import { ReviewDocument } from './review.schema';
import { REVIEW_TEMPLATES } from './prompts';

function serialize(r: ReviewDocument) {
  return {
    id: r.id,
    project: r.project.toString(),
    template: r.template,
    scope: r.scope,
    targetPaths: r.targetPaths,
    status: r.status,
    summary: r.summary,
    issues: r.issues,
    recommendations: r.recommendations,
    topSeverity: r.topSeverity,
    severityCounts: r.severityCounts,
    model: r.model,
    error: r.error,
    createdAt: (r as any).createdAt,
  };
}

@Controller()
@UseGuards(JwtAuthGuard)
export class ReviewsController {
  constructor(private readonly reviews: ReviewsService) {}

  /** Template catalog for the review-mode picker. Public to any logged-in user. */
  @Get('review-templates')
  templates() {
    return Object.entries(REVIEW_TEMPLATES).map(([key, meta]) => ({ key, ...meta }));
  }

  @Post('projects/:projectId/reviews')
  async create(
    @CurrentUser() user: AuthUser,
    @Param('projectId') projectId: string,
    @Body() dto: CreateReviewDto,
  ) {
    return serialize(await this.reviews.create(user.userId, projectId, dto));
  }

  @Get('projects/:projectId/reviews')
  async listForProject(
    @CurrentUser() user: AuthUser,
    @Param('projectId') projectId: string,
    @Query('search') search?: string,
  ) {
    const reviews = await this.reviews.list(user.userId, projectId, search);
    return reviews.map(serialize);
  }

  /** Global review history across all of the user's projects. */
  @Get('reviews')
  async listForUser(@CurrentUser() user: AuthUser, @Query('search') search?: string) {
    const reviews = await this.reviews.listForUser(user.userId, search);
    return reviews.map(serialize);
  }

  @Get('reviews/:id')
  async get(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return serialize(await this.reviews.get(user.userId, id));
  }
}
