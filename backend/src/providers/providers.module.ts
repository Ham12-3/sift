import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AiProvider, AiProviderSchema } from './provider.schema';
import { ProvidersService } from './providers.service';
import { ProvidersController } from './providers.controller';
import { AiModule } from '../ai/ai.module';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: AiProvider.name, schema: AiProviderSchema }]),
    AiModule,
  ],
  controllers: [ProvidersController],
  providers: [ProvidersService],
  exports: [ProvidersService],
})
export class ProvidersModule {}
