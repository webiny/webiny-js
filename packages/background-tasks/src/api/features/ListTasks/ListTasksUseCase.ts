import { ListTasksUseCase as UseCaseAbstraction } from "./abstractions.js";
import { TaskDefinition } from "@webiny/api-core/features/task/TaskDefinition/index.js";
import { TaskService } from "@webiny/api-core/features/task/TaskService/index.js";
import type { IListTasksResponse } from "~/api/types.js";
import type { TasksCrud } from "~/api/TasksCrud.js";

export class ListTasksUseCaseImpl implements UseCaseAbstraction.Interface {
    public constructor(private tasksCrud: TasksCrud.Interface) {}

    async execute<
        I extends TaskDefinition.TaskInput = TaskDefinition.TaskInput,
        O extends TaskService.GenericOutput = TaskService.GenericOutput
    >(params?: UseCaseAbstraction.Params): Promise<IListTasksResponse<I, O>> {
        return await this.tasksCrud.listTasks<I, O>(params);
    }
}
