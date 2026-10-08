import { createAbstraction } from "@webiny/feature/api";

/**
 * AuditLogPermissions - Whether the current identity may access audit logs.
 */
export interface IAuditLogPermissions {
    // Access to audit logs of one action.
    canAccess(action: string): Promise<boolean>;
    // Access to audit logs of every action.
    canAccessAll(): Promise<boolean>;
}

export const AuditLogPermissions = createAbstraction<IAuditLogPermissions>("AuditLogPermissions");

export namespace AuditLogPermissions {
    export type Interface = IAuditLogPermissions;
}
