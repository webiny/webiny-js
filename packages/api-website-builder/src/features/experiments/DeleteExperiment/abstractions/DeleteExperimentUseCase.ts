import { createAbstraction, type Result } from "@webiny/feature/api";
import type {
    ExperimentNotAuthorizedError,
    ExperimentNotFoundError,
    ExperimentPersistenceError
} from "~/domain/experiment/errors.js";
import type { IDeleteExperimentParams } from "./DeleteExperimentRepository.js";

export interface IDeleteExperimentUseCase {
    execute(params: IDeleteExperimentParams): Promise<Result<boolean, UseCaseError>>;
}

export interface IDeleteExperimentUseCaseErrors {
    notAuthorized: ExperimentNotAuthorizedError;
    notFound: ExperimentNotFoundError;
    persistence: ExperimentPersistenceError;
}

type UseCaseError = IDeleteExperimentUseCaseErrors[keyof IDeleteExperimentUseCaseErrors];

/** Delete an experiment. */
export const DeleteExperimentUseCase = createAbstraction<IDeleteExperimentUseCase>(
    "Wb/DeleteExperimentUseCase"
);

export namespace DeleteExperimentUseCase {
    export type Interface = IDeleteExperimentUseCase;
    export type Params = IDeleteExperimentParams;
    export type Return = Promise<Result<boolean, UseCaseError>>;
    export type Error = UseCaseError;
}
