import { createAbstraction } from "@webiny/feature/api";
import type { Result } from "@webiny/feature/api";
import type { TaskService } from "@webiny/api-core/features/task/TaskService/index.js";
import type { ITaskLog } from "~/api/types.js";
import type { ITaskLogCreateInput } from "~/api/types.js";
import type { BackgroundTaskPersistenceError } from "~/api/domain/errors.js";

type UseCaseError = BackgroundTaskPersistenceError;

export interface ICreateTaskLogUseCase {
    execute(
        task: Pick<TaskService.Task, "id">,
        data: ITaskLogCreateInput
    ): Promise<Result<ITaskLog, UseCaseError>>;
}

/** Create a new log for a task run. */
export const CreateTaskLogUseCase = createAbstraction<ICreateTaskLogUseCase>(
    "Tasks/CreateTaskLogUseCase"
);

export namespace CreateTaskLogUseCase {
    export type Interface = ICreateTaskLogUseCase;
    export type Error = UseCaseError;
}
