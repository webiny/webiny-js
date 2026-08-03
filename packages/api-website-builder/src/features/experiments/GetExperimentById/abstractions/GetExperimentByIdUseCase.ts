import { createAbstraction, type Result } from "@webiny/feature/api";
import type { WbExperiment } from "~/domain/experiment/abstractions.js";
import type {
    ExperimentNotAuthorizedError,
    ExperimentNotFoundError,
    ExperimentPersistenceError
} from "~/domain/experiment/errors.js";

export interface IGetExperimentByIdUseCase {
    execute(id: string): Promise<Result<WbExperiment, UseCaseError>>;
}

export interface IGetExperimentByIdUseCaseErrors {
    notAuthorized: ExperimentNotAuthorizedError;
    notFound: ExperimentNotFoundError;
    persistence: ExperimentPersistenceError;
}

type UseCaseError = IGetExperimentByIdUseCaseErrors[keyof IGetExperimentByIdUseCaseErrors];

/** Retrieve an experiment by ID. */
export const GetExperimentByIdUseCase = createAbstraction<IGetExperimentByIdUseCase>(
    "Wb/GetExperimentByIdUseCase"
);

export namespace GetExperimentByIdUseCase {
    export type Interface = IGetExperimentByIdUseCase;
    export type Return = Promise<Result<WbExperiment, UseCaseError>>;
    export type Error = UseCaseError;
    export type Experiment = WbExperiment;
}
