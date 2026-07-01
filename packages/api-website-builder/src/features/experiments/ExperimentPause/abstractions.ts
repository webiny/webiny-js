import { createAbstraction, type Result } from "@webiny/feature/api";
import type {
    ExperimentNotAuthorizedError,
    ExperimentPersistenceError
} from "~/domain/experiment/errors.js";

/** Runtime kill-switch key. Experiment entryIds are globally unique, so this is tenant-safe. */
export const experimentPauseKey = (experimentEntryId: string): string => {
    return `WbExperimentPaused:${experimentEntryId}`;
};

type UseCaseError = ExperimentNotAuthorizedError | ExperimentPersistenceError;

export interface IPauseExperimentUseCase {
    execute(experimentEntryId: string): Promise<Result<boolean, UseCaseError>>;
}

export const PauseExperimentUseCase = createAbstraction<IPauseExperimentUseCase>(
    "Wb/PauseExperimentUseCase"
);

export namespace PauseExperimentUseCase {
    export type Interface = IPauseExperimentUseCase;
    export type Return = Promise<Result<boolean, UseCaseError>>;
}

export interface IResumeExperimentUseCase {
    execute(experimentEntryId: string): Promise<Result<boolean, UseCaseError>>;
}

export const ResumeExperimentUseCase = createAbstraction<IResumeExperimentUseCase>(
    "Wb/ResumeExperimentUseCase"
);

export namespace ResumeExperimentUseCase {
    export type Interface = IResumeExperimentUseCase;
    export type Return = Promise<Result<boolean, UseCaseError>>;
}

export interface IIsExperimentPausedUseCase {
    execute(experimentEntryId: string): Promise<Result<boolean, UseCaseError>>;
}

export const IsExperimentPausedUseCase = createAbstraction<IIsExperimentPausedUseCase>(
    "Wb/IsExperimentPausedUseCase"
);

export namespace IsExperimentPausedUseCase {
    export type Interface = IIsExperimentPausedUseCase;
    export type Return = Promise<Result<boolean, UseCaseError>>;
}
