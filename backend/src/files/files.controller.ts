import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Param,
  Post,
  Query,
  UploadedFile,
  UploadedFiles,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor, FilesInterceptor } from '@nestjs/platform-express';
import { IsOptional, IsString, Matches } from 'class-validator';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser, AuthUser } from '../common/decorators/current-user.decorator';
import { FilesService } from './files.service';

class GithubImportDto {
  @IsString()
  @Matches(/github\.com\//i, { message: 'Must be a github.com URL' })
  url: string;

  /** Optional personal access token, e.g. for private repos when not using GitHub login. */
  @IsOptional()
  @IsString()
  token?: string;
}

interface MulterFile {
  originalname: string;
  buffer: Buffer;
}

// Upper bound per request so a huge upload can't exhaust memory. Mirrors the
// MAX_UPLOAD_BYTES documented default (25 MB).
const UPLOAD_LIMIT = Number(process.env.MAX_UPLOAD_BYTES ?? 26214400);

@Controller('projects/:projectId/files')
@UseGuards(JwtAuthGuard)
export class FilesController {
  constructor(private readonly files: FilesService) {}

  /** Option A — ZIP upload. Field name: "file". */
  @Post('upload/zip')
  @UseInterceptors(FileInterceptor('file', { limits: { fileSize: UPLOAD_LIMIT } }))
  async uploadZip(
    @CurrentUser() user: AuthUser,
    @Param('projectId') projectId: string,
    @UploadedFile() file: MulterFile,
  ) {
    if (!file) throw new BadRequestException('No file provided');
    return this.files.ingestZip(user.userId, projectId, file.buffer);
  }

  /** Option B — drag-and-drop multiple files. Field name: "files". */
  @Post('upload/files')
  @UseInterceptors(FilesInterceptor('files', 2000, { limits: { fileSize: UPLOAD_LIMIT } }))
  async uploadFiles(
    @CurrentUser() user: AuthUser,
    @Param('projectId') projectId: string,
    @UploadedFiles() files: MulterFile[],
  ) {
    if (!files?.length) throw new BadRequestException('No files provided');
    return this.files.ingestUploads(user.userId, projectId, files);
  }

  /** Option C — import a GitHub repository by URL (public, or private with auth). */
  @Post('upload/github')
  async importGithub(
    @CurrentUser() user: AuthUser,
    @Param('projectId') projectId: string,
    @Body() dto: GithubImportDto,
  ) {
    return this.files.ingestGithub(user.userId, projectId, dto.url, dto.token);
  }

  @Get('tree')
  getTree(@CurrentUser() user: AuthUser, @Param('projectId') projectId: string) {
    return this.files.getTree(user.userId, projectId);
  }

  @Get('content')
  async getContent(
    @CurrentUser() user: AuthUser,
    @Param('projectId') projectId: string,
    @Query('path') path: string,
  ) {
    if (!path) throw new BadRequestException('Query parameter "path" is required');
    const file = await this.files.getFileByPath(user.userId, projectId, path);
    return {
      path: file.path,
      language: file.language,
      size: file.size,
      content: file.content,
    };
  }
}
