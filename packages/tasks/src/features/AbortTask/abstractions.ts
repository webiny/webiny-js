import { createAbstraction, Result } from "@webiny/feature/api";
import { TaskService } from "@webiny/api-core/features/task/TaskService/index.js";
import { TaskDefinition } from "@webiny/api-core/features/task/TaskDefinition/index.js";
import { TaskDefinitionNotFoundError, TaskNotFoundError, TaskAbortError } from "~/domain/errors.js";

export interface IAbortTaskUseCase {
    execute<
        I extends TaskDefinition.TaskInput = TaskDefinition.TaskInput,
        O extends TaskService.GenericOutput = TaskService.GenericOutput
    >(
        params: AbortTaskParams
    ): Promise<Result<TaskService.Task<I, O>, UseCaseError>>;
}

export interface AbortTaskParams {
    id: string;
    message?: string;
}

export interface IAbortTaskUseCaseErrors {
    definitionNotFound: TaskDefinitionNotFoundError;
    taskNotFound: TaskNotFoundError;
    abortError: TaskAbortError;
}

type UseCaseError = IAbortTaskUseCaseErrors[keyof IAbortTaskUseCaseErrors];

export const AbortTaskUseCase = createAbstraction<IAbortTaskUseCase>("Tasks/AbortTaskUseCase");

export namespace AbortTaskUseCase {
    export type Interface = IAbortTaskUseCase;
    export type Params = AbortTaskParams;

    export type Error = UseCaseError;
    export type Return<
        I extends TaskDefinition.TaskInput = TaskDefinition.TaskInput,
        O extends TaskService.GenericOutput = TaskService.GenericOutput
    > = Promise<Result<TaskService.Task<I, O>, UseCaseError>>;
}
