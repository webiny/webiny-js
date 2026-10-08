import { ListTasksUseCase as UseCaseAbstraction } from "./abstractions.js";
import { TaskDefinition } from "@webiny/api-core/features/task/TaskDefinition/index.js";
import { TaskService } from "@webiny/api-core/features/task/TaskService/index.js";
import type { IListTasksResponse } from "~/api/types.js";
import { TasksRepository } from "~/api/domain/task/abstractions.js";

class ListTasksUseCaseImpl implements UseCaseAbstraction.Interface {
    public constructor(private readonly repository: TasksRepository.Interface) {}

    async execute<
        I extends TaskDefinition.TaskInput = TaskDefinition.TaskInput,
        O extends TaskService.GenericOutput = TaskService.GenericOutput
    >(params?: UseCaseAbstraction.Params): Promise<IListTasksResponse<I, O>> {
        const result = await this.repository.list<I, O>(params);
        if (result.isFail()) {
            throw result.error;
        }
        return result.value;
    }
}

export const ListTasksUseCase = UseCaseAbstraction.createImplementation({
    implementation: ListTasksUseCaseImpl,
    dependencies: [TasksRepository]
});
