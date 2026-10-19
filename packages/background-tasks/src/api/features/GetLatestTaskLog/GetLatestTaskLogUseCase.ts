import { GetLatestTaskLogUseCase as UseCaseAbstraction } from "./abstractions.js";
import { TaskLogsRepository } from "~/api/domain/task/abstractions.js";

class GetLatestTaskLogUseCaseImpl implements UseCaseAbstraction.Interface {
    constructor(private readonly repository: TaskLogsRepository.Interface) {}

    execute(taskId: string) {
        return this.repository.getLatest(taskId);
    }
}

export const GetLatestTaskLogUseCase = UseCaseAbstraction.createImplementation({
    implementation: GetLatestTaskLogUseCaseImpl,
    dependencies: [TaskLogsRepository]
});
