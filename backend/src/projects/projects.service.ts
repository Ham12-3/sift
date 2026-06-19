import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Project, ProjectDocument } from './project.schema';
import { CodeFile, CodeFileDocument } from '../files/file.schema';
import { Review, ReviewDocument } from '../reviews/review.schema';
import { ChatSession, ChatSessionDocument } from '../chat/chat-session.schema';
import { ChatMessage, ChatMessageDocument } from '../chat/chat-message.schema';
import { CreateProjectDto, UpdateProjectDto } from './dto/project.dto';

@Injectable()
export class ProjectsService {
  constructor(
    @InjectModel(Project.name) private readonly projectModel: Model<ProjectDocument>,
    @InjectModel(CodeFile.name) private readonly fileModel: Model<CodeFileDocument>,
    @InjectModel(Review.name) private readonly reviewModel: Model<ReviewDocument>,
    @InjectModel(ChatSession.name) private readonly sessionModel: Model<ChatSessionDocument>,
    @InjectModel(ChatMessage.name) private readonly messageModel: Model<ChatMessageDocument>,
  ) {}

  create(userId: string, dto: CreateProjectDto): Promise<ProjectDocument> {
    return this.projectModel.create({
      owner: new Types.ObjectId(userId),
      name: dto.name,
      description: dto.description ?? '',
    });
  }

  listForUser(userId: string): Promise<ProjectDocument[]> {
    return this.projectModel
      .find({ owner: new Types.ObjectId(userId) })
      .sort({ updatedAt: -1 })
      .exec();
  }

  /** Loads a project and enforces that it belongs to the requesting user. */
  async getOwned(userId: string, projectId: string): Promise<ProjectDocument> {
    if (!Types.ObjectId.isValid(projectId)) {
      throw new NotFoundException('Project not found');
    }
    const project = await this.projectModel.findById(projectId).exec();
    if (!project) {
      throw new NotFoundException('Project not found');
    }
    if (project.owner.toString() !== userId) {
      throw new ForbiddenException('You do not have access to this project');
    }
    return project;
  }

  async update(userId: string, projectId: string, dto: UpdateProjectDto): Promise<ProjectDocument> {
    const project = await this.getOwned(userId, projectId);
    if (dto.name !== undefined) project.name = dto.name;
    if (dto.description !== undefined) project.description = dto.description;
    await project.save();
    return project;
  }

  /** Removes the project and every artifact that references it. */
  async remove(userId: string, projectId: string): Promise<void> {
    const project = await this.getOwned(userId, projectId);
    const pid = project._id;
    await Promise.all([
      this.fileModel.deleteMany({ project: pid }).exec(),
      this.reviewModel.deleteMany({ project: pid }).exec(),
      this.sessionModel.deleteMany({ project: pid }).exec(),
      this.messageModel.deleteMany({ project: pid }).exec(),
    ]);
    await project.deleteOne();
  }

  async recountFiles(projectId: Types.ObjectId | string): Promise<void> {
    const count = await this.fileModel.countDocuments({ project: projectId }).exec();
    await this.projectModel.findByIdAndUpdate(projectId, { fileCount: count }).exec();
  }
}
