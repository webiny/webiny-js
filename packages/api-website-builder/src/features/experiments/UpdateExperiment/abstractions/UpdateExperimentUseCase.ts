import { createAbstraction, type Result } from "@webiny/feature/api";
import type { WbExperiment } from "~/domain/experiment/abstractions.js";
import {
    ExperimentNotAuthorizedError,
    ExperimentNotFoundError,
    ExperimentPersistenceError,
    ExperimentValidationError
} from "~/domain/experiment/errors.js";
import type { IUpdateExperimentParams } from "./UpdateExperimentRepository.js";

export interface IUpdateExperimentUseCase {
    execute(params: IUpdateExperimentParams): Promise<Result<WbExperiment, UseCaseError>>;
}

export interface IUpdateExperimentUseCaseErrors {
    notAuthorized: ExperimentNotAuthorizedError;
    notFound: ExperimentNotFoundError;
    validation: ExperimentValidationError;
    persistence: ExperimentPersistenceError;
}

type UseCaseError = IUpdateExperimentUseCaseErrors[keyof IUpdateExperimentUseCaseErrors];

/** Update an experiment's configuration (name, traffic split, targeting, goals, analytics). */
export const UpdateExperimentUseCase = createAbstraction<IUpdateExperimentUseCase>(
    "Wb/UpdateExperimentUseCase"
);

export namespace UpdateExperimentUseCase {
    export type Interface = IUpdateExperimentUseCase;
    export type Params = IUpdateExperimentParams;
    export type Return = Promise<Result<WbExperiment, UseCaseError>>;
    export type Error = UseCaseError;
}
