import { createParamDecorator, ExecutionContext } from '@nestjs/common';

/** The shape attached to `request.user` by JwtStrategy.validate(). */
export interface AuthUser {
  userId: string;
  email: string;
}

/**
 * Convenience accessor for the authenticated user on a guarded route:
 *   myRoute(@CurrentUser() user: AuthUser) { ... }
 */
export const CurrentUser = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): AuthUser => {
    const request = ctx.switchToHttp().getRequest();
    return request.user;
  },
);
