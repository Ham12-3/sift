import { Controller, Get, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from './jwt-auth.guard';
import { CurrentUser, AuthUser } from '../common/decorators/current-user.decorator';
import { UsersService } from '../users/users.service';
import { GithubService } from './github.service';

@Controller('github')
@UseGuards(JwtAuthGuard)
export class GithubController {
  constructor(
    private readonly users: UsersService,
    private readonly github: GithubService,
  ) {}

  /**
   * Repositories the signed-in user can import. `connected` is false when the
   * account has no usable GitHub token (e.g. email/password signup), so the UI
   * can fall back to manual URL entry.
   */
  @Get('repos')
  async repos(@CurrentUser() user: AuthUser) {
    const token = await this.users.getGithubToken(user.userId);
    if (!token) return { connected: false, repos: [] };
    try {
      const repos = await this.github.listRepos(token);
      return { connected: true, repos };
    } catch {
      return { connected: false, repos: [] };
    }
  }
}
