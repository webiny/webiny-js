import { GetTaskUseCase as UseCaseAbstraction } from "./abstractions.js";
import { TaskDefinition } from "@webiny/api-core/features/task/TaskDefinition/index.js";
import { TaskService } from "@webiny/api-core/features/task/TaskService/index.js";
import { TasksRepository } from "~/api/domain/task/abstractions.js";

class GetTaskUseCaseImpl implements UseCaseAbstraction.Interface {
    public constructor(private readonly repository: TasksRepository.Interface) {}

    async execute<
        I extends TaskDefinition.TaskInput = TaskDefinition.TaskInput,
        O extends TaskService.GenericOutput = TaskService.GenericOutput
    >(id: string): UseCaseAbstraction.Return<I, O> {
        return this.repository.get<I, O>(id);
    }
}

export const GetTaskUseCase = UseCaseAbstraction.createImplementation({
    implementation: GetTaskUseCaseImpl,
    dependencies: [TasksRepository]
});
