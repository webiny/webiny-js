import { createAbstraction, type Result } from "@webiny/feature/api";
import type { WbVariant, WbVariantContent } from "~/domain/variant/abstractions.js";
import type { VariantPersistenceError, VariantValidationError } from "~/domain/variant/errors.js";

/** Repository input: the baseline content has already been resolved by the use case. */
export interface ICreateVariantRepositoryParams {
    experimentId: string;
    name: string;
    content: WbVariantContent;
}

export interface ICreateVariantRepository {
    execute(params: ICreateVariantRepositoryParams): Promise<Result<WbVariant, RepositoryError>>;
}

export interface ICreateVariantRepositoryErrors {
    validation: VariantValidationError;
    persistence: VariantPersistenceError;
}

type RepositoryError = ICreateVariantRepositoryErrors[keyof ICreateVariantRepositoryErrors];

export const CreateVariantRepository = createAbstraction<ICreateVariantRepository>(
    "Wb/CreateVariantRepository"
);

export namespace CreateVariantRepository {
    export type Interface = ICreateVariantRepository;
    export type Params = ICreateVariantRepositoryParams;
    export type Return = Promise<Result<WbVariant, RepositoryError>>;
    export type Error = RepositoryError;
}
