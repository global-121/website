import {
  BadRequestException,
  HttpException,
  HttpStatus,
  ValidationPipe,
} from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import * as bodyParser from 'body-parser';
import cookieParser from 'cookie-parser';
import { ApplicationModule } from './app.module';
import {
  APP_FAVICON,
  APP_TITLE,
  APP_VERSION,
  EXTERNAL_API,
  PORT,
  SWAGGER_CUSTOM_CSS,
  SWAGGER_CUSTOM_JS,
} from './config';

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(ApplicationModule);

  const expressInstance = app.getHttpAdapter().getInstance();

  expressInstance.disable('x-powered-by');

  app.setGlobalPrefix('api');

  const options = new DocumentBuilder()
    .setTitle(APP_TITLE)
    .setVersion(APP_VERSION)
    .addServer(EXTERNAL_API.root)
    .build();
  const document = SwaggerModule.createDocument(app, options);
  SwaggerModule.setup('/docs', app, document, {
    customSiteTitle: APP_TITLE,
    customfavIcon: APP_FAVICON,
    customCss: SWAGGER_CUSTOM_CSS,
    customJs: `data:text/javascript;base64,${Buffer.from(
      SWAGGER_CUSTOM_JS,
    ).toString('base64url')}`,
    swaggerOptions: {
      persistAuthorization: true,
      tagsSorter: 'alpha',
      operationsSorter: 'alpha',
      defaultModelExpandDepth: 10,
    },
  });

  app.useGlobalPipes(
    new ValidationPipe({
      forbidUnknownValues: true,
      exceptionFactory: (errors) => {
        for (const e of errors) {
          if (e.constraints && e.constraints['unknownValue']) {
            console.log('e: ', e);
            throw new HttpException(e, HttpStatus.INTERNAL_SERVER_ERROR);
          }
        }
        throw new BadRequestException(errors);
      },
    }),
  );
  app.use(bodyParser.json({ limit: '25mb' }));
  app.use(
    bodyParser.urlencoded({
      limit: '25mb',
      extended: true,
    }),
  );
  app.use(cookieParser());

  const server = await app.listen(PORT);
  server.setTimeout(10 * 60 * 1000);
}
void bootstrap();
