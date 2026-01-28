import { createAbstraction } from "@webiny/feature/api";
import { Result } from "@webiny/feature/api";
import type { Company } from "../../domain/Company.js";
import type { CompanyNotFoundError, CompanyPersistenceError } from "./errors.js";

/**
 * GetCompanyById Use Case
 */
export interface IGetCompanyByIdUseCase {
    execute(id: string): Promise<Result<Company, UseCaseError>>;
}

export interface IGetCompanyByIdUseCaseErrors {
    notFound: CompanyNotFoundError;
    persistence: CompanyPersistenceError;
}

type UseCaseError = IGetCompanyByIdUseCaseErrors[keyof IGetCompanyByIdUseCaseErrors];

export const GetCompanyByIdUseCase =
    createAbstraction<IGetCompanyByIdUseCase>("GetCompanyByIdUseCase");

export namespace GetCompanyByIdUseCase {
    export type Interface = IGetCompanyByIdUseCase;
    export type Error = UseCaseError;
}

/**
 * GetCompanyByIdRepository - Retrieves a company from storage.
 */
export interface IGetCompanyByIdRepository {
    execute(id: string): Promise<Result<Company, RepositoryError>>;
}

export interface IGetCompanyByIdRepositoryErrors {
    notFound: CompanyNotFoundError;
    persistence: CompanyPersistenceError;
}

type RepositoryError = IGetCompanyByIdRepositoryErrors[keyof IGetCompanyByIdRepositoryErrors];

export const GetCompanyByIdRepository = createAbstraction<IGetCompanyByIdRepository>(
    "GetCompanyByIdRepository"
);

export namespace GetCompanyByIdRepository {
    export type Interface = IGetCompanyByIdRepository;
    export type Error = RepositoryError;
}
