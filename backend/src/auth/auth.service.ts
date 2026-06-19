import { ConflictException, Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { UsersService, PublicUser } from '../users/users.service';
import { encryptSecret } from '../providers/crypto.util';
import { RegisterDto, LoginDto } from './dto/auth.dto';

export interface AuthResult {
  user: PublicUser;
  accessToken: string;
}

@Injectable()
export class AuthService {
  constructor(
    private readonly users: UsersService,
    private readonly jwt: JwtService,
  ) {}

  async register(dto: RegisterDto): Promise<AuthResult> {
    const existing = await this.users.findByEmail(dto.email);
    if (existing) {
      throw new ConflictException('An account with this email already exists');
    }
    const passwordHash = await bcrypt.hash(dto.password, 12);
    const user = await this.users.create({
      email: dto.email,
      name: dto.name,
      passwordHash,
    });
    return this.issueToken(user.id, user.email, UsersService.toPublic(user));
  }

  async login(dto: LoginDto): Promise<AuthResult> {
    const user = await this.users.findByEmail(dto.email);
    if (!user) {
      throw new UnauthorizedException('Invalid email or password');
    }
    const valid = await bcrypt.compare(dto.password, user.passwordHash);
    if (!valid) {
      throw new UnauthorizedException('Invalid email or password');
    }
    return this.issueToken(user.id, user.email, UsersService.toPublic(user));
  }

  /**
   * Finds-or-creates a user from a verified GitHub profile, then issues a token.
   * Links to an existing local account when the GitHub email matches.
   */
  async githubLogin(
    profile: { githubId: string; email: string; name: string; avatarUrl: string },
    accessToken: string,
  ): Promise<AuthResult> {
    const tokenEncrypted = accessToken ? encryptSecret(accessToken) : '';
    let user = await this.users.findByGithubId(profile.githubId);
    if (!user) {
      const existing = await this.users.findByEmail(profile.email);
      if (existing) {
        existing.githubId = profile.githubId;
        if (!existing.avatarUrl) existing.avatarUrl = profile.avatarUrl;
        existing.githubAccessTokenEncrypted = tokenEncrypted;
        await existing.save();
        user = existing;
      } else {
        user = await this.users.create({
          email: profile.email,
          name: profile.name,
          githubId: profile.githubId,
          avatarUrl: profile.avatarUrl,
          githubAccessTokenEncrypted: tokenEncrypted,
        });
      }
    } else {
      // Refresh the stored token on every login so it stays valid.
      user.githubAccessTokenEncrypted = tokenEncrypted;
      await user.save();
    }
    return this.issueToken(user.id, user.email, UsersService.toPublic(user));
  }

  /** Returns just the raw JWT (used by the OAuth redirect flow). */
  signToken(userId: string, email: string): string {
    return this.jwt.sign({ sub: userId, email });
  }

  private issueToken(userId: string, email: string, user: PublicUser): AuthResult {
    const accessToken = this.signToken(userId, email);
    return { user, accessToken };
  }
}
