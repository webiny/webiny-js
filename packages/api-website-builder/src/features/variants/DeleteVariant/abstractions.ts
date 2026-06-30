import { createAbstraction, type Result } from "@webiny/feature/api";
import type {
    VariantNotAuthorizedError,
    VariantNotFoundError,
    VariantPersistenceError
} from "~/domain/variant/errors.js";

export interface IDeleteVariantParams {
    id: string;
}

export interface IDeleteVariantRepository {
    execute(params: IDeleteVariantParams): Promise<Result<boolean, RepositoryError>>;
}

export interface IDeleteVariantRepositoryErrors {
    notFound: VariantNotFoundError;
    persistence: VariantPersistenceError;
}

type RepositoryError = IDeleteVariantRepositoryErrors[keyof IDeleteVariantRepositoryErrors];

export const DeleteVariantRepository = createAbstraction<IDeleteVariantRepository>(
    "Wb/DeleteVariantRepository"
);

export namespace DeleteVariantRepository {
    export type Interface = IDeleteVariantRepository;
    export type Params = IDeleteVariantParams;
    export type Return = Promise<Result<boolean, RepositoryError>>;
    export type Error = RepositoryError;
}

export interface IDeleteVariantUseCase {
    execute(params: IDeleteVariantParams): Promise<Result<boolean, UseCaseError>>;
}

export interface IDeleteVariantUseCaseErrors {
    notAuthorized: VariantNotAuthorizedError;
    notFound: VariantNotFoundError;
    persistence: VariantPersistenceError;
}

type UseCaseError = IDeleteVariantUseCaseErrors[keyof IDeleteVariantUseCaseErrors];

/** Delete a variant. */
export const DeleteVariantUseCase =
    createAbstraction<IDeleteVariantUseCase>("Wb/DeleteVariantUseCase");

export namespace DeleteVariantUseCase {
    export type Interface = IDeleteVariantUseCase;
    export type Params = IDeleteVariantParams;
    export type Return = Promise<Result<boolean, UseCaseError>>;
    export type Error = UseCaseError;
}
