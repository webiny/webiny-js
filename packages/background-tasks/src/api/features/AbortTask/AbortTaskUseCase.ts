import { Result } from "@webiny/feature/api";
import { AbortTaskUseCase as UseCaseAbstraction } from "./abstractions.js";
import { TaskDefinition } from "@webiny/api-core/features/task/TaskDefinition/index.js";
import { TaskService } from "@webiny/api-core/features/task/TaskService/index.js";
export class AbortTaskUseCaseImpl implements UseCaseAbstraction.Interface {
    public constructor(private taskService: TaskService.Interface) {}

    async execute<
        I extends TaskDefinition.TaskInput = TaskDefinition.TaskInput,
        O extends TaskService.GenericOutput = TaskService.GenericOutput
    >(
        params: UseCaseAbstraction.Params
    ): Promise<Result<TaskService.Task<I, O>, UseCaseAbstraction.Error>> {
        const result = await this.taskService.abort<I, O>(params);
        return result as unknown as Promise<
            Result<TaskService.Task<I, O>, UseCaseAbstraction.Error>
        >;
    }
}
