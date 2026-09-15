import { createAbstraction, type Result } from "@webiny/feature/api";
import type { WbVariant } from "~/domain/variant/abstractions.js";
import type { VariantNotFoundError, VariantPersistenceError } from "~/domain/variant/errors.js";

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
