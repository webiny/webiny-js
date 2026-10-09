import { createAbstraction, type Result } from "@webiny/feature/api";
import type { TaskService } from "@webiny/api-core/features/task/TaskService/index.js";
import type { ITaskCreateData } from "~/api/types.js";
import type {
    BackgroundTaskPersistenceError,
    TaskDefinitionNotFoundError,
    TaskInputValidationError
} from "~/api/domain/errors.js";

export interface ICreateTaskUseCase {
    execute<I extends TaskService.TaskInput = TaskService.TaskInput>(
        data: ITaskCreateData<I>
    ): Promise<Result<TaskService.Task<I>, UseCaseError>>;
}

export interface ICreateTaskUseCaseErrors {
    definitionNotFound: TaskDefinitionNotFoundError;
    validation: TaskInputValidationError;
    persistence: BackgroundTaskPersistenceError;
}

type UseCaseError = ICreateTaskUseCaseErrors[keyof ICreateTaskUseCaseErrors];

/** Store a new task in the pending state. Doesn't send it for execution; see TriggerTaskUseCase. */
export const CreateTaskUseCase = createAbstraction<ICreateTaskUseCase>("Tasks/CreateTaskUseCase");

export namespace CreateTaskUseCase {
    export type Interface = ICreateTaskUseCase;
    export type Params<I extends TaskService.TaskInput = TaskService.TaskInput> =
        ITaskCreateData<I>;
    export type Error = UseCaseError;
}
