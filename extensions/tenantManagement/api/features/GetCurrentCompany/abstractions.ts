import { createAbstraction } from "@webiny/feature/api";
import { Result } from "@webiny/feature/api";
import type { Company } from "../../domain/Company.js";
import type { CompanyNotFoundError, CompanyPersistenceError } from "../../domain/errors.js";

/**
 * GetCurrentCompany Use Case
 * Gets the company associated with the current tenant context
 */
export interface IGetCurrentCompanyUseCase {
    execute(): Promise<Result<Company, UseCaseError>>;
}

export interface IGetCurrentCompanyUseCaseErrors {
    notFound: CompanyNotFoundError;
    persistence: CompanyPersistenceError;
}

type UseCaseError = IGetCurrentCompanyUseCaseErrors[keyof IGetCurrentCompanyUseCaseErrors];

export const GetCurrentCompanyUseCase = createAbstraction<IGetCurrentCompanyUseCase>(
    "GetCurrentCompanyUseCase"
);

export namespace GetCurrentCompanyUseCase {
    export type Interface = IGetCurrentCompanyUseCase;
    export type Error = UseCaseError;
}
