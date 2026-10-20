import { CreateTaskLogUseCase as UseCaseAbstraction } from "./abstractions.js";
import { TaskLogsRepository } from "~/api/domain/task/abstractions.js";
import type { TaskService } from "@webiny/api-core/features/task/TaskService/index.js";
import type { ITaskLogCreateInput } from "~/api/types.js";

class CreateTaskLogUseCaseImpl implements UseCaseAbstraction.Interface {
    constructor(private readonly repository: TaskLogsRepository.Interface) {}

    execute(task: Pick<TaskService.Task, "id">, data: ITaskLogCreateInput) {
        return this.repository.create(task, data);
    }
}

export const CreateTaskLogUseCase = UseCaseAbstraction.createImplementation({
    implementation: CreateTaskLogUseCaseImpl,
    dependencies: [TaskLogsRepository]
});
