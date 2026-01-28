import { createAbstraction } from "webiny/api";
import { Result } from "webiny/api";
import type { Company } from "../../domain/Company.js";
import {
    type TenantCreationError,
    type TenantInstallationError,
    type CompanyUpdateError,
    CompanyNotFoundError,
    CompanyPersistenceError
} from "../../domain/errors.js";

/**
 * CreateAndInstallTenant Use Case
 */
export interface ICreateAndInstallTenantUseCase {
    execute(companyId: string): Promise<Result<Company, UseCaseError>>;
}

export interface ICreateAndInstallTenantUseCaseErrors {
    tenantCreation: TenantCreationError;
    tenantInstallation: TenantInstallationError;
    notFound: CompanyNotFoundError;
    persistence: CompanyPersistenceError;
    companyUpdate: CompanyUpdateError;
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
