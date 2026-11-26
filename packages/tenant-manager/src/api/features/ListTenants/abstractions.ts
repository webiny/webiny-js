import { createAbstraction } from "@webiny/feature/api";
import { Result } from "@webiny/feature/api";
import { NotAuthorizedError } from "@webiny/api-core/features/security/shared/errors.js";
import type { Tenant } from "~/shared/Tenant.js";
import type { TenantModelNotFoundError, TenantPersistenceError } from "../../domain/errors.js";

export interface IListTenantsInput {
    /**
     * Only tenants whose name contains this text.
     */
    search?: string;
}

/**
 * ListTenants Use Case
 * Lists the enabled, installed tenants under the root tenant, sorted by name. For the tenant
 * switcher in the admin, so a root admin can open any tenant without going through Tenant Manager.
 */
export interface IListTenantsUseCase {
    execute(input: IListTenantsInput): Promise<Result<Tenant[], UseCaseError>>;
}

export interface IListTenantsUseCaseErrors {
    notAuthorized: NotAuthorizedError;
    persistence: TenantPersistenceError;
    modelNotFound: TenantModelNotFoundError;
}

type UseCaseError = IListTenantsUseCaseErrors[keyof IListTenantsUseCaseErrors];

export const ListTenantsUseCase = createAbstraction<IListTenantsUseCase>(
    "TenantManager/ListTenantsUseCase"
);

export namespace ListTenantsUseCase {
    export type Interface = IListTenantsUseCase;
    export type Input = IListTenantsInput;
    export type Error = UseCaseError;
}

export interface IListTenantsRepository {
    execute(input: IListTenantsInput): Promise<Result<Tenant[], RepositoryError>>;
}

export interface IListTenantsRepositoryErrors {
    persistence: TenantPersistenceError;
    modelNotFound: TenantModelNotFoundError;
}

type RepositoryError = IListTenantsRepositoryErrors[keyof IListTenantsRepositoryErrors];

export const ListTenantsRepository = createAbstraction<IListTenantsRepository>(
    "TenantManager/ListTenantsRepository"
);

export namespace ListTenantsRepository {
    export type Interface = IListTenantsRepository;
    export type Input = IListTenantsInput;
    export type Error = RepositoryError;
}
