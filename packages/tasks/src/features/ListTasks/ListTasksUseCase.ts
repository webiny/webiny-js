import { ListTasksUseCase as UseCaseAbstraction } from "./abstractions.js";
import { TaskDefinition } from "@webiny/api-core/features/task/TaskDefinition/index.js";
import { TaskService } from "@webiny/api-core/features/task/TaskService/index.js";
import type { Context, IListTasksResponse } from "~/types.js";

export class ListTasksUseCaseImpl implements UseCaseAbstraction.Interface {
    public constructor(private context: Context) {}

    async execute<
        I extends TaskDefinition.TaskInput = TaskDefinition.TaskInput,
        O extends TaskService.GenericOutput = TaskService.GenericOutput
    >(
        params?: UseCaseAbstraction.Params
    ): Promise<IListTasksResponse<I, O>> {
        return await this.context.tasks.listTasks<I, O>(params);
    }
}
