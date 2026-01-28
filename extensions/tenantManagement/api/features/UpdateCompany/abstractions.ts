import { createAbstraction } from "@webiny/feature/api";
import { Result } from "@webiny/feature/api";
import type { Company, CompanyValues } from "../../domain/Company.js";
import type { CompanyNotFoundError, CompanyPersistenceError } from "../../domain/errors.js";

/**
 * UpdateCompany Use Case
 */
export interface UpdateCompanyInput extends Partial<CompanyValues> {}

export interface IUpdateCompanyUseCase {
    execute(id: string, input: UpdateCompanyInput): Promise<Result<Company, UseCaseError>>;
}

export interface IUpdateCompanyUseCaseErrors {
    notFound: CompanyNotFoundError;
    persistence: CompanyPersistenceError;
}

type UseCaseError = IUpdateCompanyUseCaseErrors[keyof IUpdateCompanyUseCaseErrors];

export const UpdateCompanyUseCase =
    createAbstraction<IUpdateCompanyUseCase>("UpdateCompanyUseCase");

export namespace UpdateCompanyUseCase {
    export type Interface = IUpdateCompanyUseCase;
    export type Error = UseCaseError;
}

/**
 * UpdateCompanyRepository - Updates a company in storage.
 */
export interface IUpdateCompanyRepository {
    execute(id: string, input: UpdateCompanyInput): Promise<Result<Company, RepositoryError>>;
}

export interface IUpdateCompanyRepositoryErrors {
    notFound: CompanyNotFoundError;
    persistence: CompanyPersistenceError;
}

type RepositoryError = IUpdateCompanyRepositoryErrors[keyof IUpdateCompanyRepositoryErrors];

export const UpdateCompanyRepository =
    createAbstraction<IUpdateCompanyRepository>("UpdateCompanyRepository");

export namespace UpdateCompanyRepository {
    export type Interface = IUpdateCompanyRepository;
    export type Error = RepositoryError;
}
