import { createAbstraction } from "@webiny/feature/api";
import type { Result } from "@webiny/feature/api";
import type { NotAuthorizedError } from "@webiny/api-core/features/security/shared/errors.js";
import type { TenantNotChildError, TenantNotFoundError } from "../../domain/errors.js";

/**
 * Authorization rules for tenant management. Tenants are managed from their parent tenant:
 * the current identity needs the Tenant Manager permission, and can only manage tenants whose
 * parent is the current tenant.
 */
export interface ITenantAccess {
    /** The current identity may create tenants (as children of the current tenant). */
    canCreate(): Promise<Result<void, NotAuthorizedError>>;
    /** The current identity may manage the given tenant: it must be a child of the current tenant. */
    canManage(
        tenantId: string
    ): Promise<Result<void, NotAuthorizedError | TenantNotFoundError | TenantNotChildError>>;
}

export const TenantAccess = createAbstraction<ITenantAccess>("TenantManager/TenantAccess");

export namespace TenantAccess {
    export type Interface = ITenantAccess;
}
