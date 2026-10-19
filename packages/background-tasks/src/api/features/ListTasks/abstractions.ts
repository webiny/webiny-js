import { createAbstraction } from "@webiny/feature/api";
import type { Result } from "@webiny/feature/api";
import { TaskService } from "@webiny/api-core/features/task/TaskService/index.js";
import { TaskDefinition } from "@webiny/api-core/features/task/TaskDefinition/index.js";
import type { IListTasksResponse } from "~/api/types.js";
import type { IListTaskParams } from "~/api/types.js";
import type { BackgroundTaskPersistenceError } from "~/api/domain/errors.js";

type UseCaseError = BackgroundTaskPersistenceError;

export interface IListTasksUseCase {
    execute<
        I extends TaskDefinition.TaskInput = TaskDefinition.TaskInput,
        O extends TaskService.GenericOutput = TaskService.GenericOutput
    >(
        params?: ListTasksParams
    ): Promise<Result<IListTasksResponse<I, O>, UseCaseError>>;
}

export type ListTasksParams = IListTaskParams;

export const ListTasksUseCase = createAbstraction<IListTasksUseCase>("Tasks/ListTasksUseCase");

export namespace ListTasksUseCase {
    export type Interface = IListTasksUseCase;
    export type Params = ListTasksParams;
    export type Error = UseCaseError;

    export type Return<
        I extends TaskDefinition.TaskInput = TaskDefinition.TaskInput,
        O extends TaskService.GenericOutput = TaskService.GenericOutput
    > = Promise<Result<IListTasksResponse<I, O>, UseCaseError>>;
}
