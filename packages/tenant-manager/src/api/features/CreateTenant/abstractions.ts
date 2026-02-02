import { createAbstraction } from "@webiny/feature/api";
import { Result } from "@webiny/feature/api";
import { NotAuthorizedError } from "@webiny/api-core/features/security/shared/errors.js";
import {
    TenantCreationError,
    TenantModelNotFoundError,
    type TenantPersistenceError
} from "~/api/domain/errors.js";
import type { Tenant, TenantExtensions } from "~/shared/Tenant.js";

// USE CASE

export interface ICreateTenantInput {
    id?: string;
    name: string;
    description?: string;
    extensions: TenantExtensions;
}

export interface ICreateTenantUseCaseErrors {
    persistence: TenantPersistenceError;
    modelNotFoundError: TenantModelNotFoundError;
    notAuthorized: NotAuthorizedError;
    tenantCreation: TenantCreationError;
}

export type ICreateTenantUseCaseError =
    ICreateTenantUseCaseErrors[keyof ICreateTenantUseCaseErrors];

export interface ICreateTenantUseCase {
    execute(input: ICreateTenantInput): Promise<Result<Tenant, ICreateTenantUseCaseError>>;
}

export const CreateTenantUseCase = createAbstraction<ICreateTenantUseCase>("CreateTenantUseCase");

export namespace CreateTenantUseCase {
    export type Interface = ICreateTenantUseCase;
    export type Input = ICreateTenantInput;
    export type Error = ICreateTenantUseCaseError;
}

// REPOSITORY

export interface ICreateTenantRepositoryErrors {
    persistence: TenantPersistenceError;
    modelNotFoundError: TenantModelNotFoundError;
    tenantCreation: TenantCreationError;
}

type IRepositoryError = ICreateTenantRepositoryErrors[keyof ICreateTenantRepositoryErrors];

export interface ICreateTenantRepository {
    execute(tenant: Tenant): Promise<Result<Tenant, IRepositoryError>>;
}

export const CreateTenantRepository =
    createAbstraction<ICreateTenantRepository>("CreateTenantRepository");

export namespace CreateTenantRepository {
    export type Interface = ICreateTenantRepository;
    export type Error = IRepositoryError;
}
