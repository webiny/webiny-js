import { createAbstraction } from "@webiny/feature/api";
import { Result } from "@webiny/feature/api";
import type { Tenant, TenantValues } from "~/shared/Tenant.js";
import {
    TenantModelNotFoundError,
    type TenantNotFoundError,
    type TenantPersistenceError
} from "../../domain/errors.js";

/**
 * UpdateTenant Use Case
 */
export interface UpdateTenantInput extends Partial<TenantValues> {}

export interface IUpdateTenantUseCase {
    execute(id: string, input: UpdateTenantInput): Promise<Result<Tenant, UseCaseError>>;
}

export interface IUpdateTenantUseCaseErrors {
    notFound: TenantNotFoundError;
    persistence: TenantPersistenceError;
    modelNotFoundError: TenantModelNotFoundError;
}

type UseCaseError = IUpdateTenantUseCaseErrors[keyof IUpdateTenantUseCaseErrors];

export const UpdateTenantUseCase = createAbstraction<IUpdateTenantUseCase>(
    "TenantManager/UpdateTenantUseCase"
);

export namespace UpdateTenantUseCase {
    export type Interface = IUpdateTenantUseCase;
    export type Error = UseCaseError;
}

/**
 * UpdateTenantRepository - Updates a tenant in storage.
 */
export interface IUpdateTenantRepository {
    execute(id: string, input: UpdateTenantInput): Promise<Result<Tenant, RepositoryError>>;
}

export interface IUpdateTenantRepositoryErrors {
    notFound: TenantNotFoundError;
    persistence: TenantPersistenceError;
}

type RepositoryError = IUpdateTenantRepositoryErrors[keyof IUpdateTenantRepositoryErrors];

export const UpdateTenantRepository = createAbstraction<IUpdateTenantRepository>(
    "TenantManager/UpdateTenantRepository"
);

export namespace UpdateTenantRepository {
    export type Interface = IUpdateTenantRepository;
    export type Error = RepositoryError;
}
