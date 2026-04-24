import { createAbstraction } from "@webiny/feature/api";
import { Result } from "@webiny/feature/api";
import { NotAuthorizedError } from "@webiny/api-core/features/security/shared/errors.js";
import type { Tenant } from "~/shared/Tenant.js";
import type {
    TenantCreationError,
    TenantInstallationError,
    TenantUpdateError,
    TenantNotFoundError,
    TenantPersistenceError,
    TenantModelNotFoundError
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
    notAuthorized: NotAuthorizedError;
    persistence: TenantPersistenceError;
    tenantUpdate: TenantUpdateError;
    modelNotFoundError: TenantModelNotFoundError;
}

type UseCaseError =
    ICreateAndInstallTenantUseCaseErrors[keyof ICreateAndInstallTenantUseCaseErrors];

export const CreateAndInstallTenantUseCase = createAbstraction<ICreateAndInstallTenantUseCase>(
    "TenantManager/CreateAndInstallTenantUseCase"
);

export namespace CreateAndInstallTenantUseCase {
    export type Interface = ICreateAndInstallTenantUseCase;
    export type Error = UseCaseError;
}
