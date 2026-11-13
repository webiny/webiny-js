import { createAbstraction } from "@webiny/feature/api";
import type { Result } from "@webiny/feature/api";
import type { NotAuthorizedError } from "@webiny/api-core/features/security/shared/errors.js";
import type {
    TenantHasChildrenError,
    TenantNotChildError,
    TenantNotFoundError,
    TenantPersistenceError
} from "../../domain/errors.js";

export interface IDeleteTenantUseCaseErrors {
    notAuthorized: NotAuthorizedError;
    notFound: TenantNotFoundError;
    notChild: TenantNotChildError;
    hasChildren: TenantHasChildrenError;
    persistence: TenantPersistenceError;
}

type UseCaseError = IDeleteTenantUseCaseErrors[keyof IDeleteTenantUseCaseErrors];

/**
 * Deletes a tenant on behalf of the current identity. Only a direct sub-tenant of the current
 * tenant can be deleted, and only when it has no sub-tenants of its own.
 */
export interface IDeleteTenantUseCase {
    /** Runs the checks only. */
    canDelete(tenantId: string): Promise<Result<void, UseCaseError>>;
    /** Runs the checks, then deletes the tenant. */
    execute(tenantId: string): Promise<Result<void, UseCaseError>>;
}

export const DeleteTenantUseCase = createAbstraction<IDeleteTenantUseCase>(
    "TenantManager/DeleteTenantUseCase"
);

export namespace DeleteTenantUseCase {
    export type Interface = IDeleteTenantUseCase;
    export type Error = UseCaseError;
}
