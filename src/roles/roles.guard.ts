import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<string[]>('roles', [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!requiredRoles) {
      return true;
    }

    const { user } = context.switchToHttp().getRequest();
    console.log('RolesGuard - User:', user);

    if (!user || !user.roles) {
      console.warn('RolesGuard - User or roles are undefined');
      return false; // Deny access if roles are not defined
    }

    //return user.roles.some((role) => requiredRoles.includes(role));
    return requiredRoles.includes(user.roles);
  }
}
