import { createAbstraction } from "@webiny/feature/api";
import type { Result } from "@webiny/feature/api";
import type { TaskDefinition } from "@webiny/api-core/features/task/TaskDefinition/index.js";
import type { TaskDefinitionNotFoundError } from "~/domain/errors.js";

export interface IGetTaskDefinitionUseCase {
    execute<
        I extends TaskDefinition.TaskInput = TaskDefinition.TaskInput,
        O extends TaskDefinition.TaskOutput = TaskDefinition.TaskOutput
    >(
        id: string
    ): Result<TaskDefinition.Runnable<I, O>, UseCaseError>;
}

export interface IGetTaskDefinitionUseCaseErrors {
    notFound: TaskDefinitionNotFoundError;
}

type UseCaseError = IGetTaskDefinitionUseCaseErrors[keyof IGetTaskDefinitionUseCaseErrors];

export const GetTaskDefinitionUseCase = createAbstraction<IGetTaskDefinitionUseCase>(
    "Tasks/GetTaskDefinitionUseCase"
);

export namespace GetTaskDefinitionUseCase {
    export type Interface = IGetTaskDefinitionUseCase;

    export type Error = UseCaseError;
    export type Return<
        I extends TaskDefinition.TaskInput = TaskDefinition.TaskInput,
        O extends TaskDefinition.TaskOutput = TaskDefinition.TaskOutput
    > = Result<TaskDefinition.Runnable<I, O>, UseCaseError>;
}
