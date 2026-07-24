import { SetMetadata } from '@nestjs/common';

export const AUDIT_ACTION_KEY = 'auditAction';

/** Marks a controller method as a sensitive action to be recorded in the audit log. */
export const Audit = (action: string) => SetMetadata(AUDIT_ACTION_KEY, action);
