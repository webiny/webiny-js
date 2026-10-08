import { createAbstraction, type Result } from "@webiny/feature/api";
import type { BackgroundTaskPersistenceError, TaskNotFoundError } from "~/api/domain/errors.js";

export interface IDeleteTaskUseCase {
    execute(id: string): Promise<Result<void, UseCaseError>>;
}

export interface IDeleteTaskUseCaseErrors {
    notFound: TaskNotFoundError;
    persistence: BackgroundTaskPersistenceError;
}

type UseCaseError = IDeleteTaskUseCaseErrors[keyof IDeleteTaskUseCaseErrors];

/** Delete a single stored task. Its logs and child tasks stay; see CleanupTaskSubtreeUseCase. */
export const DeleteTaskUseCase = createAbstraction<IDeleteTaskUseCase>("Tasks/DeleteTaskUseCase");

export namespace DeleteTaskUseCase {
    export type Interface = IDeleteTaskUseCase;
    export type Error = UseCaseError;
}
