import { UpdateTaskLogUseCase as UseCaseAbstraction } from "./abstractions.js";
import { TaskLogsRepository } from "~/api/domain/task/abstractions.js";
import type { ITaskLogUpdateInput } from "~/api/types.js";

class UpdateTaskLogUseCaseImpl implements UseCaseAbstraction.Interface {
    constructor(private readonly repository: TaskLogsRepository.Interface) {}

    execute(id: string, data: ITaskLogUpdateInput) {
        return this.repository.update(id, data);
    }
}

export const UpdateTaskLogUseCase = UseCaseAbstraction.createImplementation({
    implementation: UpdateTaskLogUseCaseImpl,
    dependencies: [TaskLogsRepository]
});
