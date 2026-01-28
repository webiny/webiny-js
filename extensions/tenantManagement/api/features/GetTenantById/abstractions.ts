import { createAbstraction } from "webiny/api";
import { Result } from "webiny/api";
import type { Tenant } from "../../../shared/Tenant.js";
import type { TenantNotFoundError, TenantPersistenceError } from "../../domain/errors.js";

/**
 * GetTenantById Use Case
 */
export interface IGetTenantByIdUseCase {
    execute(id: string): Promise<Result<Tenant, UseCaseError>>;
}

export interface IGetTenantByIdUseCaseErrors {
    notFound: TenantNotFoundError;
    persistence: TenantPersistenceError;
}

type UseCaseError = IGetTenantByIdUseCaseErrors[keyof IGetTenantByIdUseCaseErrors];

export const GetTenantByIdUseCase =
    createAbstraction<IGetTenantByIdUseCase>("GetTenantByIdUseCase");

export namespace GetTenantByIdUseCase {
    export type Interface = IGetTenantByIdUseCase;
    export type Error = UseCaseError;
}

/**
 * GetTenantByIdRepository - Retrieves a tenant from storage.
 */
export interface IGetTenantByIdRepository {
    execute(id: string): Promise<Result<Tenant, RepositoryError>>;
}

export interface IGetTenantByIdRepositoryErrors {
    notFound: TenantNotFoundError;
    persistence: TenantPersistenceError;
}

type RepositoryError = IGetTenantByIdRepositoryErrors[keyof IGetTenantByIdRepositoryErrors];

export const GetTenantByIdRepository =
    createAbstraction<IGetTenantByIdRepository>("GetTenantByIdRepository");

export namespace GetTenantByIdRepository {
    export type Interface = IGetTenantByIdRepository;
    export type Error = RepositoryError;
}
