import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { ConfigService } from '@nestjs/config';
import { Model, Types } from 'mongoose';
import { AiProvider, AiProviderDocument } from './provider.schema';
import { CreateProviderDto, UpdateProviderDto } from './dto/provider.dto';
import { decryptSecret, encryptSecret, maskHint } from './crypto.util';
import { ProviderConfig } from '../ai/ai-client.service';

/** Provider as exposed to clients — never includes the raw or encrypted key. */
export interface PublicProvider {
  id: string;
  name: string;
  baseUrl: string;
  model: string;
  apiKeyHint: string;
  isDefault: boolean;
}

/** The optional .env-configured fallback provider (key omitted). */
export interface EnvDefaultInfo {
  configured: boolean;
  name?: string;
  baseUrl?: string;
  model?: string;
}

@Injectable()
export class ProvidersService {
  constructor(
    @InjectModel(AiProvider.name) private readonly model: Model<AiProviderDocument>,
    private readonly config: ConfigService,
  ) {}

  async create(userId: string, dto: CreateProviderDto): Promise<PublicProvider> {
    const owner = new Types.ObjectId(userId);
    const count = await this.model.countDocuments({ owner }).exec();
    // First provider a user adds is the default; otherwise honor the flag.
    const isDefault = dto.isDefault ?? count === 0;
    if (isDefault) {
      await this.model.updateMany({ owner }, { isDefault: false }).exec();
    }
    const created = await this.model.create({
      owner,
      name: dto.name,
      baseUrl: dto.baseUrl,
      modelName: dto.model,
      apiKeyEncrypted: dto.apiKey ? encryptSecret(dto.apiKey) : '',
      apiKeyHint: dto.apiKey ? maskHint(dto.apiKey) : '',
      isDefault,
    });
    return ProvidersService.toPublic(created);
  }

  async list(userId: string): Promise<PublicProvider[]> {
    const providers = await this.model
      .find({ owner: new Types.ObjectId(userId) })
      .sort({ isDefault: -1, createdAt: 1 })
      .exec();
    return providers.map(ProvidersService.toPublic);
  }

  async update(userId: string, id: string, dto: UpdateProviderDto): Promise<PublicProvider> {
    const provider = await this.getOwned(userId, id);
    if (dto.name !== undefined) provider.name = dto.name;
    if (dto.baseUrl !== undefined) provider.baseUrl = dto.baseUrl;
    if (dto.model !== undefined) provider.modelName = dto.model;
    if (dto.apiKey !== undefined) {
      provider.apiKeyEncrypted = dto.apiKey ? encryptSecret(dto.apiKey) : '';
      provider.apiKeyHint = dto.apiKey ? maskHint(dto.apiKey) : '';
    }
    if (dto.isDefault) {
      await this.model
        .updateMany({ owner: provider.owner, _id: { $ne: provider._id } }, { isDefault: false })
        .exec();
      provider.isDefault = true;
    }
    await provider.save();
    return ProvidersService.toPublic(provider);
  }

  async remove(userId: string, id: string): Promise<void> {
    const provider = await this.getOwned(userId, id);
    const wasDefault = provider.isDefault;
    await provider.deleteOne();
    if (wasDefault) {
      // Promote the oldest remaining provider so a default always exists.
      const next = await this.model
        .findOne({ owner: provider.owner })
        .sort({ createdAt: 1 })
        .exec();
      if (next) {
        next.isDefault = true;
        await next.save();
      }
    }
  }

  /**
   * Returns a usable (decrypted) config for the review/chat engines.
   * Resolution order: an explicitly requested provider → the user's default
   * provider → the optional .env default. This lets a self-hoster set one model
   * in .env and never touch the UI, while UI providers still take precedence.
   */
  async resolveConfig(userId: string, providerId?: string): Promise<ProviderConfig> {
    if (providerId) {
      const provider = await this.getOwned(userId, providerId);
      return this.toConfig(provider);
    }
    const owner = new Types.ObjectId(userId);
    const provider = await this.model.findOne({ owner, isDefault: true }).exec();
    if (provider) return this.toConfig(provider);

    const envDefault = this.envDefault();
    if (envDefault) return envDefault;

    throw new NotFoundException(
      'No AI provider configured. Add one in Settings, or set DEFAULT_AI_* in the backend .env.',
    );
  }

  /** Reads the optional .env-configured fallback provider, if present. */
  private envDefault(): ProviderConfig | null {
    const baseUrl = this.config.get<string>('DEFAULT_AI_BASE_URL');
    const model = this.config.get<string>('DEFAULT_AI_MODEL');
    if (!baseUrl || !model) return null;
    return { baseUrl, model, apiKey: this.config.get<string>('DEFAULT_AI_API_KEY') ?? '' };
  }

  /** Public, key-free view of the .env default for the Settings screen. */
  getEnvDefaultInfo(): EnvDefaultInfo {
    const env = this.envDefault();
    if (!env) return { configured: false };
    return {
      configured: true,
      name: this.config.get<string>('DEFAULT_AI_NAME') ?? 'Environment default',
      baseUrl: env.baseUrl,
      model: env.model,
    };
  }

  private toConfig(provider: AiProviderDocument): ProviderConfig {
    return {
      baseUrl: provider.baseUrl,
      model: provider.modelName,
      apiKey: provider.apiKeyEncrypted ? decryptSecret(provider.apiKeyEncrypted) : '',
    };
  }

  private async getOwned(userId: string, id: string): Promise<AiProviderDocument> {
    if (!Types.ObjectId.isValid(id)) throw new NotFoundException('Provider not found');
    const provider = await this.model.findById(id).exec();
    if (!provider || provider.owner.toString() !== userId) {
      throw new NotFoundException('Provider not found');
    }
    return provider;
  }

  static toPublic(p: AiProviderDocument): PublicProvider {
    return {
      id: p.id,
      name: p.name,
      baseUrl: p.baseUrl,
      model: p.modelName,
      apiKeyHint: p.apiKeyHint,
      isDefault: p.isDefault,
    };
  }
}
