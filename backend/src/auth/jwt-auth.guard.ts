import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

/** Protects a route: requires a valid `Authorization: Bearer <jwt>` header. */
@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {}
