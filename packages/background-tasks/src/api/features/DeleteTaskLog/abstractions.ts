import { createAbstraction } from "@webiny/feature/api";
import type { Result } from "@webiny/feature/api";

import type { BackgroundTaskPersistenceError } from "~/api/domain/errors.js";
import type { TaskLogNotFoundError } from "~/api/domain/errors.js";

type UseCaseError = TaskLogNotFoundError | BackgroundTaskPersistenceError;

export interface IDeleteTaskLogUseCase {
    execute(id: string): Promise<Result<void, UseCaseError>>;
}

/** Delete a task log. */
export const DeleteTaskLogUseCase = createAbstraction<IDeleteTaskLogUseCase>(
    "Tasks/DeleteTaskLogUseCase"
);

export namespace DeleteTaskLogUseCase {
    export type Interface = IDeleteTaskLogUseCase;
    export type Error = UseCaseError;
}
