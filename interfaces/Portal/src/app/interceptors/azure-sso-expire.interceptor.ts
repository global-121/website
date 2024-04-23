import {
  HttpEvent,
  HttpHandler,
  HttpInterceptor,
  HttpRequest,
} from '@angular/common/http';
import { Injectable } from '@angular/core';
import { from, lastValueFrom, Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { AuthService } from '../auth/auth.service';
import { ApiPath } from '../enums/api-path.enum';

@Injectable()
export class AzureSsoExpireInterceptor implements HttpInterceptor {
  constructor(private authService: AuthService) {}

  intercept(
    req: HttpRequest<unknown>,
    next: HttpHandler,
  ): Observable<HttpEvent<any>> {
    if (!environment.use_sso_azure_entra) {
      return next.handle(req);
    }

    return from(this.handle(req, next));
  }

  async handle(request: HttpRequest<any>, next: HttpHandler) {
    if (request.url.startsWith(environment.url_121_service_api)) {
      if (
        !request.url.includes(ApiPath.usersCurrent) &&
        !request.url.includes(ApiPath.usersLogin) &&
        !request.url.includes(ApiPath.usersLogout)
      ) {
        await this.authService.checkExpirationDate();
      }
    }
    return await lastValueFrom(next.handle(request));
  }
}
