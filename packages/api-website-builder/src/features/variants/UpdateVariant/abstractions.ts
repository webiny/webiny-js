import { createAbstraction, type Result } from "@webiny/feature/api";
import type { VariantStatus, WbVariant } from "~/domain/variant/abstractions.js";
import type {
    VariantNotAuthorizedError,
    VariantNotFoundError,
    VariantPersistenceError,
    VariantValidationError
} from "~/domain/variant/errors.js";

export interface IUpdateVariantData {
    name?: string;
    status?: VariantStatus;
    properties?: Record<string, any>;
    metadata?: Record<string, any>;
    bindings?: Record<string, any>;
    elements?: Record<string, any>;
    extensions?: Record<string, any>;
}

export interface IUpdateVariantParams {
    id: string;
    data: IUpdateVariantData;
}

export interface IUpdateVariantRepository {
    execute(params: IUpdateVariantParams): Promise<Result<WbVariant, RepositoryError>>;
}

export interface IUpdateVariantRepositoryErrors {
    notFound: VariantNotFoundError;
    validation: VariantValidationError;
    persistence: VariantPersistenceError;
}

type RepositoryError = IUpdateVariantRepositoryErrors[keyof IUpdateVariantRepositoryErrors];

export const UpdateVariantRepository = createAbstraction<IUpdateVariantRepository>(
    "Wb/UpdateVariantRepository"
);

export namespace UpdateVariantRepository {
    export type Interface = IUpdateVariantRepository;
    export type Params = IUpdateVariantParams;
    export type Return = Promise<Result<WbVariant, RepositoryError>>;
    export type Error = RepositoryError;
}

export interface IUpdateVariantUseCase {
    execute(params: IUpdateVariantParams): Promise<Result<WbVariant, UseCaseError>>;
}

export interface IUpdateVariantUseCaseErrors {
    notAuthorized: VariantNotAuthorizedError;
    notFound: VariantNotFoundError;
    validation: VariantValidationError;
    persistence: VariantPersistenceError;
}

type UseCaseError = IUpdateVariantUseCaseErrors[keyof IUpdateVariantUseCaseErrors];

/** Update a variant's content snapshot or status. */
export const UpdateVariantUseCase =
    createAbstraction<IUpdateVariantUseCase>("Wb/UpdateVariantUseCase");

export namespace UpdateVariantUseCase {
    export type Interface = IUpdateVariantUseCase;
    export type Params = IUpdateVariantParams;
    export type Return = Promise<Result<WbVariant, UseCaseError>>;
    export type Error = UseCaseError;
}
