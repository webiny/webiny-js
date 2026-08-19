import { createAbstraction, type Result } from "@webiny/feature/api";
import type { WbExperiment } from "~/domain/experiment/abstractions.js";
import type {
    ExperimentNotAuthorizedError,
    ExperimentNotFoundError,
    ExperimentPersistenceError,
    ExperimentValidationError
} from "~/domain/experiment/errors.js";

export interface IStopExperimentParams {
    id: string;
}

export interface IStopExperimentUseCase {
    execute(params: IStopExperimentParams): Promise<Result<WbExperiment, UseCaseError>>;
}

export interface IStopExperimentUseCaseErrors {
    notAuthorized: ExperimentNotAuthorizedError;
    notFound: ExperimentNotFoundError;
    validation: ExperimentValidationError;
    persistence: ExperimentPersistenceError;
}

type UseCaseError = IStopExperimentUseCaseErrors[keyof IStopExperimentUseCaseErrors];

/** Stop a running experiment. */
export const StopExperimentUseCase = createAbstraction<IStopExperimentUseCase>(
    "Wb/StopExperimentUseCase"
);

export namespace StopExperimentUseCase {
    export type Interface = IStopExperimentUseCase;
    export type Params = IStopExperimentParams;
    export type Return = Promise<Result<WbExperiment, UseCaseError>>;
    export type Error = UseCaseError;
    export type Experiment = WbExperiment;
}
