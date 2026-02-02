import { createAbstraction } from "@webiny/feature/api";
import { Result } from "@webiny/feature/api";
import type { Tenant } from "~/shared/Tenant.js";
import type {
    TenantModelNotFoundError,
    TenantNotFoundError,
    TenantPersistenceError
} from "../../domain/errors.js";

/**
 * GetCurrentTenant Use Case
 * Gets the tenant associated with the current tenant context
 */
export interface IGetCurrentTenantUseCase {
    execute(): Promise<Result<Tenant, UseCaseError>>;
}

export interface IGetCurrentTenantUseCaseErrors {
    notFound: TenantNotFoundError;
    persistence: TenantPersistenceError;
    modelNotFoundError: TenantModelNotFoundError;
}

type UseCaseError = IGetCurrentTenantUseCaseErrors[keyof IGetCurrentTenantUseCaseErrors];

export const GetCurrentTenantUseCase =
    createAbstraction<IGetCurrentTenantUseCase>("GetCurrentTenantUseCase");

export namespace GetCurrentTenantUseCase {
    export type Interface = IGetCurrentTenantUseCase;
    export type Error = UseCaseError;
}
