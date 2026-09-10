import { createAbstraction, type Result } from "@webiny/feature/api";
import type {
    ExperimentNotAuthorizedError,
    ExperimentPersistenceError
} from "~/domain/experiment/errors.js";

type UseCaseError = ExperimentNotAuthorizedError | ExperimentPersistenceError;

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
