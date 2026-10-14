import { createAbstraction } from "@webiny/feature/api";
import type { Result } from "@webiny/feature/api";
import { TaskService } from "@webiny/api-core/features/task/TaskService/index.js";
import { TaskDefinition } from "@webiny/api-core/features/task/TaskDefinition/index.js";
import type { BackgroundTaskPersistenceError } from "~/api/domain/errors.js";
import type { TaskNotFoundError } from "~/api/domain/errors.js";

type UseCaseError = TaskNotFoundError | BackgroundTaskPersistenceError;

export interface IGetTaskUseCase {
    execute<
        I extends TaskDefinition.TaskInput = TaskDefinition.TaskInput,
        O extends TaskService.GenericOutput = TaskService.GenericOutput
    >(
        id: string
    ): Promise<Result<TaskService.Task<I, O>, UseCaseError>>;
}

/** Get a single task. Fails with TaskNotFoundError when it doesn't exist. */
export const GetTaskUseCase = createAbstraction<IGetTaskUseCase>("Tasks/GetTaskUseCase");

export namespace GetTaskUseCase {
    export type Interface = IGetTaskUseCase;
    export type Error = UseCaseError;

    export type Return<
        I extends TaskDefinition.TaskInput = TaskDefinition.TaskInput,
        O extends TaskService.GenericOutput = TaskService.GenericOutput
    > = Promise<Result<TaskService.Task<I, O>, UseCaseError>>;
}
