import { createAbstraction } from "@webiny/feature/api";
import type { Result } from "@webiny/feature/api";
import type { ITaskLog } from "~/api/types.js";
import type { BackgroundTaskPersistenceError } from "~/api/domain/errors.js";
import type { TaskLogNotFoundError } from "~/api/domain/errors.js";

type UseCaseError = TaskLogNotFoundError | BackgroundTaskPersistenceError;

export interface IGetLatestTaskLogUseCase {
    execute(taskId: string): Promise<Result<ITaskLog, UseCaseError>>;
}

/** Get the most recent log of a task. Fails with TaskLogNotFoundError when the task has none yet. */
export const GetLatestTaskLogUseCase = createAbstraction<IGetLatestTaskLogUseCase>(
    "Tasks/GetLatestTaskLogUseCase"
);

export namespace GetLatestTaskLogUseCase {
    export type Interface = IGetLatestTaskLogUseCase;
    export type Error = UseCaseError;
}
