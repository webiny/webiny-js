import { createAbstraction } from "@webiny/feature/api";
import { TaskService } from "@webiny/api-core/features/task/TaskService/index.js";
import { TaskDefinition } from "@webiny/api-core/features/task/TaskDefinition/index.js";

export interface IGetTaskUseCase {
    execute<
        I extends TaskDefinition.TaskInput = TaskDefinition.TaskInput,
        O extends TaskService.GenericOutput = TaskService.GenericOutput
    >(
        id: string
    ): Promise<TaskService.Task<I, O> | null>;
}

export const GetTaskUseCase = createAbstraction<IGetTaskUseCase>(
    "Tasks/GetTaskUseCase"
);

export namespace GetTaskUseCase {
    export type Interface = IGetTaskUseCase;

    export type Return<
        I extends TaskDefinition.TaskInput = TaskDefinition.TaskInput,
        O extends TaskService.GenericOutput = TaskService.GenericOutput
    > = Promise<TaskService.Task<I, O> | null>;
}
