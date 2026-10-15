import { createAbstraction, type Result } from "@webiny/feature/api";
import type { TaskService } from "@webiny/api-core/features/task/TaskService/index.js";
import type { ITaskUpdateData } from "~/api/types.js";
import type { BackgroundTaskPersistenceError, TaskNotFoundError } from "~/api/domain/errors.js";

type TaskInput = TaskService.TaskInput;
type TaskOutput = TaskService.GenericOutput;

export interface IUpdateTaskUseCase {
    execute<I extends TaskInput = TaskInput, O extends TaskOutput = TaskOutput>(
        id: string,
        data: Partial<ITaskUpdateData<I, O>>
    ): Promise<Result<TaskService.Task<I, O>, UseCaseError>>;
}

export interface IUpdateTaskUseCaseErrors {
    notFound: TaskNotFoundError;
    persistence: BackgroundTaskPersistenceError;
}

type UseCaseError = IUpdateTaskUseCaseErrors[keyof IUpdateTaskUseCaseErrors];

/** Update a stored task: its status, output, iterations and so on. */
export const UpdateTaskUseCase = createAbstraction<IUpdateTaskUseCase>("Tasks/UpdateTaskUseCase");

export namespace UpdateTaskUseCase {
    export type Interface = IUpdateTaskUseCase;
    export type Params<
        I extends TaskInput = TaskInput,
        O extends TaskOutput = TaskOutput
    > = Partial<ITaskUpdateData<I, O>>;
    export type Error = UseCaseError;
}
