import { createAbstraction, type Result } from "@webiny/feature/api";
import type {
    VariantNotAuthorizedError,
    VariantNotFoundError,
    VariantPersistenceError
} from "~/domain/variant/errors.js";
import type { IDeleteVariantParams } from "./DeleteVariantRepository.js";

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
