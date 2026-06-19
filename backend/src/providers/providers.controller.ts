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
import { ProvidersService } from './providers.service';
import { CreateProviderDto, UpdateProviderDto } from './dto/provider.dto';
import { AiClientService } from '../ai/ai-client.service';

@Controller('providers')
@UseGuards(JwtAuthGuard)
export class ProvidersController {
  constructor(
    private readonly providers: ProvidersService,
    private readonly ai: AiClientService,
  ) {}

  @Post()
  create(@CurrentUser() user: AuthUser, @Body() dto: CreateProviderDto) {
    return this.providers.create(user.userId, dto);
  }

  @Get()
  list(@CurrentUser() user: AuthUser) {
    return this.providers.list(user.userId);
  }

  /** The optional .env fallback provider (no key) so the UI can surface it. */
  @Get('env-default')
  envDefault() {
    return this.providers.getEnvDefaultInfo();
  }

  @Patch(':id')
  update(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
    @Body() dto: UpdateProviderDto,
  ) {
    return this.providers.update(user.userId, id, dto);
  }

  @Delete(':id')
  async remove(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    await this.providers.remove(user.userId, id);
    return { success: true };
  }

  /** Verifies the saved provider can reach its endpoint and produce a completion. */
  @Post(':id/test')
  async test(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    const config = await this.providers.resolveConfig(user.userId, id);
    return this.ai.testConnection(config);
  }
}
