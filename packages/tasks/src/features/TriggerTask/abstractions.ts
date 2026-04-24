import { createAbstraction, Result } from "@webiny/feature/api";
import { TaskService } from "@webiny/api-core/features/task/TaskService/index.js";
import { TaskDefinition } from "@webiny/api-core/features/task/TaskDefinition/index.js";
import {
    TaskDefinitionNotFoundError,
    TaskNotFoundError,
    TaskServiceInfoError
} from "~/domain/errors.js";

export interface ITriggerTaskUseCase {
    execute<
        I extends TaskDefinition.TaskInput = TaskDefinition.TaskInput,
        O extends TaskService.GenericOutput = TaskService.GenericOutput
    >(
        params: TriggerTaskParams<I>
    ): Promise<Result<TaskService.Task<I, O>, UseCaseError>>;
}

export interface TriggerTaskParams<I = TaskDefinition.TaskInput> {
    definition: string;
    input?: I;
    name?: string;
    parent?: Pick<TaskService.Task, "id">;
    delay?: number;
}

export interface ITriggerTaskUseCaseErrors {
    definitionNotFound: TaskDefinitionNotFoundError;
    taskNotFound: TaskNotFoundError;
    serviceError: TaskServiceInfoError;
}

type UseCaseError = ITriggerTaskUseCaseErrors[keyof ITriggerTaskUseCaseErrors];

export const TriggerTaskUseCase = createAbstraction<ITriggerTaskUseCase>(
    "Tasks/TriggerTaskUseCase"
);

export namespace TriggerTaskUseCase {
    export type Interface = ITriggerTaskUseCase;
    export type Params<I = TaskDefinition.TaskInput> = TriggerTaskParams<I>;

    export type Error = UseCaseError;
    export type Return<
        I extends TaskDefinition.TaskInput = TaskDefinition.TaskInput,
        O extends TaskService.GenericOutput = TaskService.GenericOutput
    > = Promise<Result<TaskService.Task<I, O>, UseCaseError>>;
}
