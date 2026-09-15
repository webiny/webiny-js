import { createAbstraction, type Result } from "@webiny/feature/api";
import type { WbVariant } from "~/domain/variant/abstractions.js";
import type {
    VariantNotAuthorizedError,
    VariantPersistenceError,
    VariantValidationError
} from "~/domain/variant/errors.js";
import type {
    ExperimentNotAuthorizedError,
    ExperimentNotFoundError,
    ExperimentPersistenceError
} from "~/domain/experiment/errors.js";
import type {
    PageNotAuthorizedError,
    PageNotFoundError,
    PagePersistenceError
} from "~/domain/page/errors.js";

/** Use case input: a variant starts as a copy of the experiment's baseline revision content. */
export interface ICreateVariantParams {
    experimentId: string;
    name: string;
}

export interface ICreateVariantUseCase {
    execute(params: ICreateVariantParams): Promise<Result<WbVariant, UseCaseError>>;
}

export interface ICreateVariantUseCaseErrors {
    notAuthorized: VariantNotAuthorizedError;
    validation: VariantValidationError;
    persistence: VariantPersistenceError;
    experimentNotFound: ExperimentNotFoundError;
    experimentNotAuthorized: ExperimentNotAuthorizedError;
    experimentPersistence: ExperimentPersistenceError;
    baselineNotFound: PageNotFoundError;
    baselineNotAuthorized: PageNotAuthorizedError;
    baselinePersistence: PagePersistenceError;
}

type UseCaseError = ICreateVariantUseCaseErrors[keyof ICreateVariantUseCaseErrors];

/** Create a variant as a full content snapshot of the experiment's baseline revision. */
export const CreateVariantUseCase =
    createAbstraction<ICreateVariantUseCase>("Wb/CreateVariantUseCase");

export namespace CreateVariantUseCase {
    export type Interface = ICreateVariantUseCase;
    export type Params = ICreateVariantParams;
    export type Return = Promise<Result<WbVariant, UseCaseError>>;
    export type Error = UseCaseError;
    export type Variant = WbVariant;
}
