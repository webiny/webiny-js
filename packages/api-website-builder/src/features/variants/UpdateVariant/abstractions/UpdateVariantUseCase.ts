import { createAbstraction, type Result } from "@webiny/feature/api";
import type { WbVariant } from "~/domain/variant/abstractions.js";
import type {
    VariantNotAuthorizedError,
    VariantNotFoundError,
    VariantPersistenceError,
    VariantValidationError
} from "~/domain/variant/errors.js";
import type { IUpdateVariantParams } from "./UpdateVariantRepository.js";

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
