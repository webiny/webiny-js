import { createAbstraction } from "webiny/api";
import { Result } from "webiny/api";
import type { Tenant } from "../../domain/Tenant.js";
import {
    type TenantCreationError,
    type TenantInstallationError,
    type TenantUpdateError,
    TenantNotFoundError,
    TenantPersistenceError
} from "../../domain/errors.js";

/**
 * CreateAndInstallTenant Use Case
 */
export interface ICreateAndInstallTenantUseCase {
    execute(tenantId: string): Promise<Result<Tenant, UseCaseError>>;
}

export interface ICreateAndInstallTenantUseCaseErrors {
    tenantCreation: TenantCreationError;
    tenantInstallation: TenantInstallationError;
    notFound: TenantNotFoundError;
    persistence: TenantPersistenceError;
    tenantUpdate: TenantUpdateError;
}

type UseCaseError =
    ICreateAndInstallTenantUseCaseErrors[keyof ICreateAndInstallTenantUseCaseErrors];

export const CreateAndInstallTenantUseCase = createAbstraction<ICreateAndInstallTenantUseCase>(
    "CreateAndInstallTenantUseCase"
);

export namespace CreateAndInstallTenantUseCase {
    export type Interface = ICreateAndInstallTenantUseCase;
    export type Error = UseCaseError;
}
