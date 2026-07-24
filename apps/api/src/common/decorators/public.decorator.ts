import { SetMetadata } from '@nestjs/common';
import { PUBLIC_KEY } from '../constants';

/** Marks a route as not requiring authentication (bypasses the global JwtAuthGuard). */
export const Public = () => SetMetadata(PUBLIC_KEY, true);
