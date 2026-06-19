import { Body, Controller, Get, HttpCode, Post, Query, Res, UseGuards } from '@nestjs/common';
import { Response } from 'express';
import { AuthService } from './auth.service';
import { GithubService } from './github.service';
import { RegisterDto, LoginDto } from './dto/auth.dto';
import { JwtAuthGuard } from './jwt-auth.guard';
import { CurrentUser, AuthUser } from '../common/decorators/current-user.decorator';
import { UsersService } from '../users/users.service';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly auth: AuthService,
    private readonly users: UsersService,
    private readonly github: GithubService,
  ) {}

  @Post('register')
  register(@Body() dto: RegisterDto) {
    return this.auth.register(dto);
  }

  @Post('login')
  @HttpCode(200)
  login(@Body() dto: LoginDto) {
    return this.auth.login(dto);
  }

  // Stateless JWTs: "logout" is a client-side token discard. This endpoint
  // exists so the frontend has a uniform call and we can hook server-side
  // revocation here later (e.g. a token denylist) without changing clients.
  @Post('logout')
  @HttpCode(200)
  @UseGuards(JwtAuthGuard)
  logout() {
    return { success: true };
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  async me(@CurrentUser() current: AuthUser) {
    const user = await this.users.findById(current.userId);
    return user ? UsersService.toPublic(user) : null;
  }

  // ── GitHub OAuth ──────────────────────────────────────

  /** Step 1: send the user to GitHub (or back to the UI if not configured). */
  @Get('github')
  startGithub(@Res() res: Response) {
    if (!this.github.isConfigured()) {
      return res.redirect(`${this.github.frontendUrl}/auth?error=github_not_configured`);
    }
    // A random state value guards against CSRF on the callback.
    const state = Math.random().toString(36).slice(2);
    return res.redirect(this.github.buildAuthorizeUrl(state));
  }

  /** Step 2: GitHub redirects here with a code; we mint a JWT and hand it to the UI. */
  @Get('github/callback')
  async githubCallback(@Query('code') code: string, @Res() res: Response) {
    const ui = this.github.frontendUrl;
    if (!code) return res.redirect(`${ui}/auth?error=github_failed`);
    try {
      const { profile, accessToken: ghToken } = await this.github.exchangeCodeForProfile(code);
      const { accessToken } = await this.auth.githubLogin(profile, ghToken);
      return res.redirect(`${ui}/auth/callback?token=${encodeURIComponent(accessToken)}`);
    } catch {
      return res.redirect(`${ui}/auth?error=github_failed`);
    }
  }
}
