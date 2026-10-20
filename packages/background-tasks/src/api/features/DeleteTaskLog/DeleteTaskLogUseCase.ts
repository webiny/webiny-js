import { DeleteTaskLogUseCase as UseCaseAbstraction } from "./abstractions.js";
import { TaskLogsRepository } from "~/api/domain/task/abstractions.js";

class DeleteTaskLogUseCaseImpl implements UseCaseAbstraction.Interface {
    constructor(private readonly repository: TaskLogsRepository.Interface) {}

    execute(id: string) {
        return this.repository.delete(id);
    }
}

export const DeleteTaskLogUseCase = UseCaseAbstraction.createImplementation({
    implementation: DeleteTaskLogUseCaseImpl,
    dependencies: [TaskLogsRepository]
});
