import { BadRequestException, ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import * as bodyParser from 'body-parser';
import cookieParser from 'cookie-parser';
import { ApplicationModule } from './app.module';
import {
  APP_FAVICON,
  APP_TITLE,
  APP_VERSION,
  DEBUG,
  EXTERNAL_API,
  PORT,
  SWAGGER_CUSTOM_CSS,
} from './config';
import appInsights = require('applicationinsights');

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(ApplicationModule);

  // NOTE: this commented out code can be used to visualize module dependencies using nestjs-spelunker
  // Paste the outcome in https://mermaid.live
  // const tree = SpelunkerModule.explore(app);
  // const root = SpelunkerModule.graph(tree);
  // const edges = SpelunkerModule.findGraphEdges(root);
  // const genericModules = [
  //   'ApplicationModule',
  //   'DiscoveryModule',
  //   'ScheduleModule',
  //   'TypeOrmCoreModule',
  //   'TypeOrmModule',
  //   'HttpModule',
  //   'ScriptsModule',
  //   'TerminusModule',
  //   'HealthModule',
  //   'MulterModule',
  //   'UserModule',
  //   'ActionModule',
  // ];
  // const mermaidEdges = edges
  //   .filter(
  //     ({ from, to }) =>
  //       !genericModules.includes(from.module.name) &&
  //       !genericModules.includes(to.module.name),
  //   )
  //   .map(({ from, to }) => `  ${from.module.name}-->${to.module.name}`);
  // console.log('graph LR');
  // console.log(mermaidEdges.join('\n'));

  app.setGlobalPrefix('api');

  app
    .getHttpAdapter()
    .getInstance()
    .disable('x-powered-by');

  if (DEBUG) {
    app.enableCors({
      origin: true,
      methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
      credentials: true,
    });
  }
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
    swaggerOptions: {
      persistAuthorization: true,
      tagsSorter: 'alpha',
      operationsSorter: 'alpha',
    },
  });
  app.useGlobalPipes(
    new ValidationPipe({
      exceptionFactory: errors => new BadRequestException(errors),
    }),
  );
  app.use(bodyParser.json({ limit: '5mb' }));
  app.use(
    bodyParser.urlencoded({
      limit: '5mb',
      extended: true,
    }),
  );
  app.use(cookieParser());
  const server = await app.listen(PORT);
  server.setTimeout(10 * 60 * 1000);
}
bootstrap();

if (!!process.env.APPLICATION_INSIGHT_IKEY) {
  appInsights.setup(process.env.APPLICATION_INSIGHT_IKEY);
  appInsights.start();
}
