import { BadGatewayException, Injectable, Logger } from '@nestjs/common';
import OpenAI from 'openai';

export interface ProviderConfig {
  baseUrl: string;
  apiKey: string;
  model: string;
}

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface CompletionOptions {
  /** Force the model to return a JSON object (used by the review engine). */
  json?: boolean;
  temperature?: number;
  maxTokens?: number;
}

/**
 * Thin wrapper over the OpenAI SDK. Because the SDK only needs a `baseURL` and
 * `apiKey`, the same code path serves OpenAI, LM Studio, Ollama, OpenRouter, and
 * any other OpenAI-compatible endpoint — the provider config is supplied per call,
 * never hardcoded.
 */
@Injectable()
export class AiClientService {
  private readonly logger = new Logger(AiClientService.name);

  private client(config: ProviderConfig): OpenAI {
    return new OpenAI({
      baseURL: config.baseUrl.replace(/\/+$/, ''),
      // Local servers (LM Studio/Ollama) often need no key; the SDK requires a
      // non-empty string, so we fall back to a placeholder.
      apiKey: config.apiKey || 'not-needed',
    });
  }

  async complete(
    config: ProviderConfig,
    messages: ChatMessage[],
    options: CompletionOptions = {},
  ): Promise<string> {
    try {
      const res = await this.client(config).chat.completions.create({
        model: config.model,
        messages,
        temperature: options.temperature ?? 0.2,
        max_tokens: options.maxTokens,
        ...(options.json ? { response_format: { type: 'json_object' } } : {}),
      });
      return res.choices[0]?.message?.content ?? '';
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      this.logger.error(`AI request failed: ${message}`);
      throw new BadGatewayException(`AI provider request failed: ${message}`);
    }
  }

  /** Lightweight connectivity check used by the provider settings UI. */
  async testConnection(config: ProviderConfig): Promise<{ ok: boolean; message: string }> {
    try {
      const reply = await this.complete(
        config,
        [{ role: 'user', content: 'Reply with the single word: pong' }],
        { maxTokens: 10 },
      );
      return { ok: true, message: reply.trim().slice(0, 100) || 'Connected' };
    } catch (err) {
      return { ok: false, message: err instanceof Error ? err.message : 'Connection failed' };
    }
  }
}
