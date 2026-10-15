import { ListTasksUseCase as UseCaseAbstraction } from "./abstractions.js";
import { TaskDefinition } from "@webiny/api-core/features/task/TaskDefinition/index.js";
import { TaskService } from "@webiny/api-core/features/task/TaskService/index.js";
import { TasksRepository } from "~/api/domain/task/abstractions.js";

class ListTasksUseCaseImpl implements UseCaseAbstraction.Interface {
    public constructor(private readonly repository: TasksRepository.Interface) {}

    async execute<
        I extends TaskDefinition.TaskInput = TaskDefinition.TaskInput,
        O extends TaskService.GenericOutput = TaskService.GenericOutput
    >(params?: UseCaseAbstraction.Params): UseCaseAbstraction.Return<I, O> {
        return this.repository.list<I, O>(params);
    }
}

export const ListTasksUseCase = UseCaseAbstraction.createImplementation({
    implementation: ListTasksUseCaseImpl,
    dependencies: [TasksRepository]
});
