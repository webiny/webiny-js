import { GetTaskUseCase as UseCaseAbstraction } from "./abstractions.js";
import { TaskDefinition } from "@webiny/api-core/features/task/TaskDefinition/index.js";
import { TaskService } from "@webiny/api-core/features/task/TaskService/index.js";
import type { Context } from "~/api/types.js";

export class GetTaskUseCaseImpl implements UseCaseAbstraction.Interface {
    public constructor(private context: Context) {}

    async execute<
        I extends TaskDefinition.TaskInput = TaskDefinition.TaskInput,
        O extends TaskService.GenericOutput = TaskService.GenericOutput
    >(id: string): Promise<TaskService.Task<I, O> | null> {
        return await this.context.tasks.getTask<I, O>(id);
    }
}
