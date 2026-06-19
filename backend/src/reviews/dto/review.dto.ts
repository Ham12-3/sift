import {
  ArrayMaxSize,
  IsArray,
  IsIn,
  IsOptional,
  IsString,
} from 'class-validator';
import { ReviewTemplate } from '../review.schema';

export class CreateReviewDto {
  @IsIn(['security', 'performance', 'quality'])
  template: ReviewTemplate;

  /**
   * Paths to review. Omit (or empty) to review the entire project.
   * One path = single-file review; many = multi-file review.
   */
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(500)
  @IsString({ each: true })
  paths?: string[];

  /** Optional provider id; falls back to the user's default provider. */
  @IsOptional()
  @IsString()
  providerId?: string;
}
