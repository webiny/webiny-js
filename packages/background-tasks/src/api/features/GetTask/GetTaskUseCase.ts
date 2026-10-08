import { GetTaskUseCase as UseCaseAbstraction } from "./abstractions.js";
import { TaskDefinition } from "@webiny/api-core/features/task/TaskDefinition/index.js";
import { TaskService } from "@webiny/api-core/features/task/TaskService/index.js";
import { TasksRepository } from "~/api/domain/task/abstractions.js";
import { TaskNotFoundError } from "~/api/domain/errors.js";

class GetTaskUseCaseImpl implements UseCaseAbstraction.Interface {
    public constructor(private readonly repository: TasksRepository.Interface) {}

    async execute<
        I extends TaskDefinition.TaskInput = TaskDefinition.TaskInput,
        O extends TaskService.GenericOutput = TaskService.GenericOutput
    >(id: string): Promise<TaskService.Task<I, O> | null> {
        const result = await this.repository.get<I, O>(id);
        if (result.isOk()) {
            return result.value;
        } else if (result.error instanceof TaskNotFoundError) {
            return null;
        }
        throw result.error;
    }
}

export const GetTaskUseCase = UseCaseAbstraction.createImplementation({
    implementation: GetTaskUseCaseImpl,
    dependencies: [TasksRepository]
});
