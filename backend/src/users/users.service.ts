import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User, UserDocument } from './user.schema';
import { decryptSecret } from '../providers/crypto.util';

/** User object safe to send to clients (no password hash). */
export interface PublicUser {
  id: string;
  email: string;
  name: string;
  avatarUrl?: string;
}

@Injectable()
export class UsersService {
  constructor(@InjectModel(User.name) private readonly userModel: Model<UserDocument>) {}

  findByEmail(email: string): Promise<UserDocument | null> {
    return this.userModel.findOne({ email: email.toLowerCase().trim() }).exec();
  }

  findById(id: string): Promise<UserDocument | null> {
    return this.userModel.findById(id).exec();
  }

  findByGithubId(githubId: string): Promise<UserDocument | null> {
    return this.userModel.findOne({ githubId }).exec();
  }

  /** Decrypted GitHub access token for the user, or null if none stored. */
  async getGithubToken(userId: string): Promise<string | null> {
    const user = await this.userModel.findById(userId, 'githubAccessTokenEncrypted').exec();
    if (!user?.githubAccessTokenEncrypted) return null;
    try {
      return decryptSecret(user.githubAccessTokenEncrypted);
    } catch {
      return null;
    }
  }

  create(data: {
    email: string;
    name: string;
    passwordHash?: string;
    githubId?: string;
    avatarUrl?: string;
    githubAccessTokenEncrypted?: string;
  }): Promise<UserDocument> {
    return this.userModel.create(data);
  }

  static toPublic(user: UserDocument): PublicUser {
    return { id: user.id, email: user.email, name: user.name, avatarUrl: user.avatarUrl || undefined };
  }
}
