import { Controller, Get, Module } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import {
  HealthCheck,
  HealthCheckResult,
  HealthCheckService,
  TerminusModule,
  TypeOrmHealthIndicator,
} from '@nestjs/terminus';
import { APP_VERSION } from './config';

@ApiTags('instance')
@Controller('health')
export class HealthController {
  public constructor(
    private health: HealthCheckService,
    private db: TypeOrmHealthIndicator,
  ) {}

  @Get('health')
  @HealthCheck()
  public check(): Promise<HealthCheckResult> {
    return this.health.check([
      () => this.db.pingCheck('database', { timeout: 300 }),
    ]);
  }

  @Get('version')
  public version(): {
    schemaVersion: number;
    label: string;
    message: string;
    isError?: boolean;
  } {
    const version = APP_VERSION;

    // See: https://shields.io/endpoint
    return {
      schemaVersion: 1,
      label: 'build',
      message: !!version ? version.trim() : 'n/a',
      isError: !version,
    };
  }
}

@Module({
  controllers: [HealthController],
  imports: [TerminusModule],
})
export class HealthModule {}
