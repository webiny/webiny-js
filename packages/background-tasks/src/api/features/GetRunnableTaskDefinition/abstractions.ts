import { createAbstraction } from "@webiny/feature/api";
import type { Result } from "@webiny/feature/api";
import type { TaskDefinition } from "@webiny/api-core/features/task/TaskDefinition/index.js";
import type { TaskDefinitionNotFoundError } from "~/api/domain/errors.js";

export interface IGetRunnableTaskDefinitionUseCase {
    execute<
        I extends TaskDefinition.TaskInput = TaskDefinition.TaskInput,
        O extends TaskDefinition.TaskOutput = TaskDefinition.TaskOutput
    >(
        id: string
    ): Result<TaskDefinition.Runnable<I, O>, UseCaseError>;
}

export interface IGetRunnableTaskDefinitionUseCaseErrors {
    notFound: TaskDefinitionNotFoundError;
}

type UseCaseError =
    IGetRunnableTaskDefinitionUseCaseErrors[keyof IGetRunnableTaskDefinitionUseCaseErrors];

export const GetRunnableTaskDefinitionUseCase =
    createAbstraction<IGetRunnableTaskDefinitionUseCase>("Tasks/GetRunnableTaskDefinitionUseCase");

export namespace GetRunnableTaskDefinitionUseCase {
    export type Interface = IGetRunnableTaskDefinitionUseCase;

    export type Error = UseCaseError;
    export type Return<
        I extends TaskDefinition.TaskInput = TaskDefinition.TaskInput,
        O extends TaskDefinition.TaskOutput = TaskDefinition.TaskOutput
    > = Result<TaskDefinition.Runnable<I, O>, UseCaseError>;
}
