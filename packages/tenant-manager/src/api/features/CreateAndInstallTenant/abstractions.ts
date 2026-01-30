import { createAbstraction } from "@webiny/feature/api";
import { Result } from "@webiny/feature/api";
import type { Tenant } from "../../../shared/Tenant.js";
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
