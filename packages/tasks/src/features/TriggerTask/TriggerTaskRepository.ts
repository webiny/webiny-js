import { Result } from "@webiny/feature/api";
import { TriggerTaskRepository as RepositoryAbstraction } from "./abstractions.js";
import { TaskDefinition } from "@webiny/api-core/features/task/TaskDefinition/index.js";
import { TaskService } from "@webiny/api-core/features/task/TaskService/index.js";
import { TaskServiceInfoError } from "~/domain/errors.js";

class TriggerTaskRepositoryImpl implements RepositoryAbstraction.Interface {
    public constructor(private taskService: TaskService.Interface) {}

    async execute<
        I extends TaskDefinition.TaskInput = TaskDefinition.TaskInput,
        O extends TaskService.GenericOutput = TaskService.GenericOutput
    >(
        params: RepositoryAbstraction.Params<I>
    ): Promise<Result<TaskService.Task<I, O>, RepositoryAbstraction.Error>> {
        const { taskData, delay } = params;

        const triggerResult = await this.taskService.trigger<I, O>({
            definition: taskData.definitionId,
            input: taskData.input,
            name: taskData.name,
            parent: taskData.parentId ? { id: taskData.parentId } : undefined,
            delay
        });

        if (triggerResult.isFail()) {
            return Result.fail(new TaskServiceInfoError());
        }

        return Result.ok(triggerResult.value);
    }
}

export const TriggerTaskRepository = RepositoryAbstraction.createImplementation({
    implementation: TriggerTaskRepositoryImpl,
    dependencies: [TaskService]
});
