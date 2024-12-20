import { HttpModule } from '@nestjs/axios';
import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { SafaricomTransferEntity } from '@121-service/src/payments/fsp-integration/safaricom/entities/safaricom-transfer.entity';
import { SafaricomTransferScopedRepository } from '@121-service/src/payments/fsp-integration/safaricom/repositories/safaricom-transfer.scoped.repository';
import { SafaricomController } from '@121-service/src/payments/fsp-integration/safaricom/safaricom.controller';
import { SafaricomService } from '@121-service/src/payments/fsp-integration/safaricom/safaricom.service';
import { SafaricomApiHelperService } from '@121-service/src/payments/fsp-integration/safaricom/services/safaricom.api.helper.service';
import { SafaricomApiService } from '@121-service/src/payments/fsp-integration/safaricom/services/safaricom.api.service';
import { RedisModule } from '@121-service/src/payments/redis/redis.module';
import { QueuesRegistryModule } from '@121-service/src/queues-registry/queues-registry.module';
import { AzureLoggerMiddleware } from '@121-service/src/shared/middleware/azure-logger.middleware';
import { CustomHttpService } from '@121-service/src/shared/services/custom-http.service';
import { TokenValidationService } from '@121-service/src/utils/token/token-validation.service';

@Module({
  imports: [
    HttpModule,
    TypeOrmModule.forFeature([SafaricomTransferEntity]),
    RedisModule,
    QueuesRegistryModule,
  ],
  providers: [
    SafaricomService,
    SafaricomApiService,
    SafaricomApiHelperService,
    TokenValidationService,
    CustomHttpService,
    SafaricomTransferScopedRepository,
  ],
  controllers: [SafaricomController],
  exports: [SafaricomService, SafaricomTransferScopedRepository],
})
export class SafaricomModule implements NestModule {
  configure(consumer: MiddlewareConsumer): void {
    consumer.apply(AzureLoggerMiddleware).forRoutes(SafaricomController);
  }
}
