import { createAbstraction } from "@webiny/feature/api";
import { TaskService } from "@webiny/api-core/features/task/TaskService/index.js";
import { TaskDefinition } from "@webiny/api-core/features/task/TaskDefinition/index.js";
import type { IListTasksResponse, IListTaskParams } from "~/types.js";

export interface IListTasksUseCase {
    execute<
        I extends TaskDefinition.TaskInput = TaskDefinition.TaskInput,
        O extends TaskService.GenericOutput = TaskService.GenericOutput
    >(
        params?: ListTasksParams
    ): Promise<IListTasksResponse<I, O>>;
}

export type ListTasksParams = IListTaskParams;

export const ListTasksUseCase = createAbstraction<IListTasksUseCase>(
    "Tasks/ListTasksUseCase"
);

export namespace ListTasksUseCase {
    export type Interface = IListTasksUseCase;
    export type Params = ListTasksParams;

    export type Return<
        I extends TaskDefinition.TaskInput = TaskDefinition.TaskInput,
        O extends TaskService.GenericOutput = TaskService.GenericOutput
    > = Promise<IListTasksResponse<I, O>>;
}
