import { createAbstraction, type Result } from "@webiny/feature/api";
import type { WbVariant } from "~/domain/variant/abstractions.js";
import type {
    VariantNotAuthorizedError,
    VariantPersistenceError
} from "~/domain/variant/errors.js";

export interface IListVariantsParams {
    experimentId: string;
}

export interface IListVariantsRepository {
    execute(params: IListVariantsParams): Promise<Result<WbVariant[], RepositoryError>>;
}

export interface IListVariantsRepositoryErrors {
    persistence: VariantPersistenceError;
}

type RepositoryError = IListVariantsRepositoryErrors[keyof IListVariantsRepositoryErrors];

export const ListVariantsRepository = createAbstraction<IListVariantsRepository>(
    "Wb/ListVariantsRepository"
);

export namespace ListVariantsRepository {
    export type Interface = IListVariantsRepository;
    export type Params = IListVariantsParams;
    export type Return = Promise<Result<WbVariant[], RepositoryError>>;
    export type Error = RepositoryError;
}

export interface IListVariantsUseCase {
    execute(params: IListVariantsParams): Promise<Result<WbVariant[], UseCaseError>>;
}

export interface IListVariantsUseCaseErrors {
    notAuthorized: VariantNotAuthorizedError;
    persistence: VariantPersistenceError;
}

type UseCaseError = IListVariantsUseCaseErrors[keyof IListVariantsUseCaseErrors];

/** List variants for an experiment. */
export const ListVariantsUseCase =
    createAbstraction<IListVariantsUseCase>("Wb/ListVariantsUseCase");

export namespace ListVariantsUseCase {
    export type Interface = IListVariantsUseCase;
    export type Params = IListVariantsParams;
    export type Return = Promise<Result<WbVariant[], UseCaseError>>;
    export type Error = UseCaseError;
}
