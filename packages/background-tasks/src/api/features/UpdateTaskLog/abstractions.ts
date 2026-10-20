import { createAbstraction } from "@webiny/feature/api";
import type { Result } from "@webiny/feature/api";
import type { ITaskLog } from "~/api/types.js";
import type { ITaskLogUpdateInput } from "~/api/types.js";
import type { BackgroundTaskPersistenceError } from "~/api/domain/errors.js";
import type { TaskLogNotFoundError } from "~/api/domain/errors.js";

type UseCaseError = TaskLogNotFoundError | BackgroundTaskPersistenceError;

export interface IUpdateTaskLogUseCase {
    execute(id: string, data: ITaskLogUpdateInput): Promise<Result<ITaskLog, UseCaseError>>;
}

/** Update a task log, usually to append items. */
export const UpdateTaskLogUseCase = createAbstraction<IUpdateTaskLogUseCase>(
    "Tasks/UpdateTaskLogUseCase"
);

export namespace UpdateTaskLogUseCase {
    export type Interface = IUpdateTaskLogUseCase;
    export type Error = UseCaseError;
}
