import { createAbstraction, type Result } from "@webiny/feature/api";
import type { WbVariant } from "~/domain/variant/abstractions.js";
import type {
    VariantNotAuthorizedError,
    VariantNotFoundError,
    VariantPersistenceError
} from "~/domain/variant/errors.js";

export interface IGetVariantByIdRepository {
    execute(id: string): Promise<Result<WbVariant, RepositoryError>>;
}

export interface IGetVariantByIdRepositoryErrors {
    notFound: VariantNotFoundError;
    persistence: VariantPersistenceError;
}

type RepositoryError = IGetVariantByIdRepositoryErrors[keyof IGetVariantByIdRepositoryErrors];

export const GetVariantByIdRepository = createAbstraction<IGetVariantByIdRepository>(
    "Wb/GetVariantByIdRepository"
);

export namespace GetVariantByIdRepository {
    export type Interface = IGetVariantByIdRepository;
    export type Return = Promise<Result<WbVariant, RepositoryError>>;
    export type Error = RepositoryError;
}

export interface IGetVariantByIdUseCase {
    execute(id: string): Promise<Result<WbVariant, UseCaseError>>;
}

export interface IGetVariantByIdUseCaseErrors {
    notAuthorized: VariantNotAuthorizedError;
    notFound: VariantNotFoundError;
    persistence: VariantPersistenceError;
}

type UseCaseError = IGetVariantByIdUseCaseErrors[keyof IGetVariantByIdUseCaseErrors];

/** Retrieve a variant by ID. */
export const GetVariantByIdUseCase = createAbstraction<IGetVariantByIdUseCase>(
    "Wb/GetVariantByIdUseCase"
);

export namespace GetVariantByIdUseCase {
    export type Interface = IGetVariantByIdUseCase;
    export type Return = Promise<Result<WbVariant, UseCaseError>>;
    export type Error = UseCaseError;
    export type Variant = WbVariant;
}
