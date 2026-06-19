import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser, AuthUser } from '../common/decorators/current-user.decorator';
import { ProjectsService } from './projects.service';
import { CreateProjectDto, UpdateProjectDto } from './dto/project.dto';
import { ProjectDocument } from './project.schema';

function serialize(p: ProjectDocument) {
  return {
    id: p.id,
    name: p.name,
    description: p.description,
    fileCount: p.fileCount,
    createdAt: (p as any).createdAt,
    updatedAt: (p as any).updatedAt,
  };
}

@Controller('projects')
@UseGuards(JwtAuthGuard)
export class ProjectsController {
  constructor(private readonly projects: ProjectsService) {}

  @Post()
  async create(@CurrentUser() user: AuthUser, @Body() dto: CreateProjectDto) {
    return serialize(await this.projects.create(user.userId, dto));
  }

  @Get()
  async list(@CurrentUser() user: AuthUser) {
    const projects = await this.projects.listForUser(user.userId);
    return projects.map(serialize);
  }

  @Get(':id')
  async get(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return serialize(await this.projects.getOwned(user.userId, id));
  }

  @Patch(':id')
  async update(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
    @Body() dto: UpdateProjectDto,
  ) {
    return serialize(await this.projects.update(user.userId, id, dto));
  }

  @Delete(':id')
  async remove(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    await this.projects.remove(user.userId, id);
    return { success: true };
  }
}
