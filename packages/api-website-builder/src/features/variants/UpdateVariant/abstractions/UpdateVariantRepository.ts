import { createAbstraction, type Result } from "@webiny/feature/api";
import type { VariantStatus, WbVariant } from "~/domain/variant/abstractions.js";
import type {
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
