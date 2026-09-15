import { createAbstraction, type Result } from "@webiny/feature/api";
import type { WbExperiment } from "~/domain/experiment/abstractions.js";
import type {
    ExperimentAlreadyActiveError,
    ExperimentNotAuthorizedError,
    ExperimentNotFoundError,
    ExperimentPersistenceError,
    ExperimentValidationError
} from "~/domain/experiment/errors.js";

export interface IStartExperimentParams {
    id: string;
}

export interface IStartExperimentUseCase {
    execute(params: IStartExperimentParams): Promise<Result<WbExperiment, UseCaseError>>;
}

export interface IStartExperimentUseCaseErrors {
    notAuthorized: ExperimentNotAuthorizedError;
    notFound: ExperimentNotFoundError;
    alreadyActive: ExperimentAlreadyActiveError;
    validation: ExperimentValidationError;
    persistence: ExperimentPersistenceError;
}

type UseCaseError = IStartExperimentUseCaseErrors[keyof IStartExperimentUseCaseErrors];

/** Start an experiment against its baseline revision. One active experiment per revision. */
export const StartExperimentUseCase = createAbstraction<IStartExperimentUseCase>(
    "Wb/StartExperimentUseCase"
);

export namespace StartExperimentUseCase {
    export type Interface = IStartExperimentUseCase;
    export type Params = IStartExperimentParams;
    export type Return = Promise<Result<WbExperiment, UseCaseError>>;
    export type Error = UseCaseError;
    export type Experiment = WbExperiment;
}
