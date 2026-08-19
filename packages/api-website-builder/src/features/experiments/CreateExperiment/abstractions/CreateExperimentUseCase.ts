import { createAbstraction, type Result } from "@webiny/feature/api";
import type {
    ExperimentAnalyticsConfig,
    ExperimentGoals,
    ExperimentTargeting,
    ExperimentTrafficSplit,
    WbExperiment
} from "~/domain/experiment/abstractions.js";
import {
    ExperimentNotAuthorizedError,
    ExperimentPersistenceError,
    ExperimentValidationError
} from "~/domain/experiment/errors.js";

export interface ICreateExperimentParams {
    pageEntryId: string;
    baselineRevisionId: string;
    name: string;
    trafficSplit?: ExperimentTrafficSplit;
    targeting?: ExperimentTargeting;
    goals?: ExperimentGoals;
    analytics?: ExperimentAnalyticsConfig;
}

export interface ICreateExperimentUseCase {
    execute(params: ICreateExperimentParams): Promise<Result<WbExperiment, UseCaseError>>;
}

export interface ICreateExperimentUseCaseErrors {
    notAuthorized: ExperimentNotAuthorizedError;
    validation: ExperimentValidationError;
    persistence: ExperimentPersistenceError;
}

type UseCaseError = ICreateExperimentUseCaseErrors[keyof ICreateExperimentUseCaseErrors];

/** Create a new experiment against a published page revision. */
export const CreateExperimentUseCase = createAbstraction<ICreateExperimentUseCase>(
    "Wb/CreateExperimentUseCase"
);

export namespace CreateExperimentUseCase {
    export type Interface = ICreateExperimentUseCase;
    export type Params = ICreateExperimentParams;
    export type Return = Promise<Result<WbExperiment, UseCaseError>>;
    export type Error = UseCaseError;
    export type Experiment = WbExperiment;
}
