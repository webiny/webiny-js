import { createAbstraction, type Result } from "@webiny/feature/api";
import type {
    ExperimentNotAuthorizedError,
    ExperimentPersistenceError
} from "~/domain/experiment/errors.js";

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
