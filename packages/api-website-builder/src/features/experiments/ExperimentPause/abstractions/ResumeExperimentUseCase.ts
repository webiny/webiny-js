import { createAbstraction, type Result } from "@webiny/feature/api";
import type {
    ExperimentNotAuthorizedError,
    ExperimentPersistenceError
} from "~/domain/experiment/errors.js";

type UseCaseError = ExperimentNotAuthorizedError | ExperimentPersistenceError;

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
