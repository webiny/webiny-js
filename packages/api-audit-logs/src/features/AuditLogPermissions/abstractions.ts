import { createAbstraction } from "@webiny/feature/api";

/**
 * AuditLogPermissions - Whether the current identity may access audit logs of an action.
 */
export interface IAuditLogPermissions {
    canAccess(action: string): Promise<boolean>;
}

export const AuditLogPermissions = createAbstraction<IAuditLogPermissions>("AuditLogPermissions");

export namespace AuditLogPermissions {
    export type Interface = IAuditLogPermissions;
}
