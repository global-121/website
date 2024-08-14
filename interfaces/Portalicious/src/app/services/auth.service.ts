import { PermissionEnum } from '@121-service/src/user/enum/permission.enum';
import { Injectable, inject } from '@angular/core';
import { Router } from '@angular/router';
import { AppRoutes } from '~/app.routes';
import { User } from '~/models/user.model';
import { ApiService } from '~/services/api.service';
import { LogEvent, LogService } from '~/services/log.service';
import { environment } from '~environment';

type LocalStorageUser = Pick<
  User,
  'expires' | 'isAdmin' | 'isEntraUser' | 'permissions' | 'username'
>;

const LOCAL_STORAGE_AUTH_USER_KEY = 'logged-in-user-portalicious';

export function getUserFromLocalStorage(): LocalStorageUser | null {
  const rawUser = localStorage.getItem(LOCAL_STORAGE_AUTH_USER_KEY);

  if (!rawUser) {
    return null;
  }

  let user: LocalStorageUser;

  try {
    user = JSON.parse(rawUser) as LocalStorageUser;
  } catch {
    console.warn('AuthService: Invalid token');
    return null;
  }

  return user;
}

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private readonly apiService = inject(ApiService);
  private readonly logService = inject(LogService);
  private readonly router = inject(Router);

  public get isLoggedIn(): boolean {
    return this.user !== null;
  }

  public get isAdmin(): boolean {
    return this.user?.isAdmin ?? false;
  }

  private setUserInStorage(user: User): void {
    const userToStore: LocalStorageUser = {
      username: user.username,
      permissions: user.permissions,
      isAdmin: user.isAdmin,
      isEntraUser: user.isEntraUser,
      expires: user.expires ?? undefined,
    };

    localStorage.setItem(
      LOCAL_STORAGE_AUTH_USER_KEY,
      JSON.stringify(userToStore),
    );
  }

  get user(): LocalStorageUser | null {
    const user = getUserFromLocalStorage();

    if (!user?.username) {
      console.warn('AuthService: No valid user');
      return null;
    }

    if (
      // Only check for non-SSO users
      !environment.use_sso_azure_entra &&
      (!user.expires || Date.parse(user.expires) < Date.now())
    ) {
      console.warn('AuthService: Expired token');
      return null;
    }

    return user;
  }

  public async login({
    username,
    password,
  }: {
    username: string;
    password: string;
  }) {
    this.logService.logEvent(LogEvent.userLogin);

    try {
      const user = await this.apiService.login({ username, password });
      this.setUserInStorage(user);
    } catch (error) {
      console.error('AuthService: login error: ', error);
    }

    if (!this.user) {
      throw new Error(
        $localize`Invalid email or password.  Double-check your credentials and try again.`,
      );
    }
  }

  public async logout() {
    this.logService.logEvent(LogEvent.userLogout);

    if (!this.user?.username) {
      await this.router.navigate(['/', AppRoutes.login]);
      return;
    }

    // Cleanup local state, to leave no trace of the user.
    localStorage.removeItem(LOCAL_STORAGE_AUTH_USER_KEY);

    await this.apiService.logout();
    await this.router.navigate(['/', AppRoutes.login]);
  }

  public getAssignedProjectIds(): number[] {
    return this.user ? Object.keys(this.user.permissions).map(Number) : [];
  }

  public async changePassword({
    password,
    newPassword,
  }: {
    password: string;
    newPassword: string;
  }) {
    const username = this.user?.username;

    if (!username) {
      throw new Error(
        $localize`:@@generic-error:An unexpected error has occurred. Please try again later.`,
      );
    }

    try {
      return await this.apiService.changePassword({
        username,
        password,
        newPassword,
      });
    } catch (error) {
      console.error(error);
      throw new Error(
        $localize`Failed to change the password. Please refresh the page and try again.`,
      );
    }
  }

  public async refreshCurrentUser() {
    const userDto = await this.apiService.getCurrentUser();

    if (!userDto?.user) {
      await this.logout();
      return;
    }

    this.setUserInStorage(userDto.user);
  }

  private isAssignedToProgram(
    programId: number,
    user?: LocalStorageUser | null,
  ): boolean {
    user = user ?? this.user;
    return (
      !!user?.permissions &&
      Object.keys(user.permissions).includes(String(programId))
    );
  }

  public hasPermission(
    programId: number,
    requiredPermission: PermissionEnum,
    user?: LocalStorageUser | null,
  ): boolean {
    user = user ?? this.user;
    // During development: Use this to simulate a user not having a certain permission
    // user.permissions[programId] = user.permissions[programId].filter(
    //   (p) => p !== Permission.FspDebitCardBLOCK,
    // );

    // TODO: Move this to a better place in the flow, so it doesn't have to be checked this often
    // Check with Azure (again) when user has no permissions (yet)
    if (!this.isAssignedToProgram(programId, user)) {
      void this.refreshCurrentUser(); // Don't await, as it will block all permission-checks
    }

    return (
      !!user?.permissions &&
      this.isAssignedToProgram(programId, user) &&
      user.permissions[programId].includes(requiredPermission)
    );
  }
}
