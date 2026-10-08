import { ListTaskLogsUseCase as UseCaseAbstraction } from "./abstractions.js";
import { TaskLogsRepository } from "~/api/domain/task/abstractions.js";
import type { IListTaskLogParams } from "~/api/types.js";

class ListTaskLogsUseCaseImpl implements UseCaseAbstraction.Interface {
    constructor(private readonly repository: TaskLogsRepository.Interface) {}

    execute(params: IListTaskLogParams) {
        return this.repository.list(params);
    }
}

export const ListTaskLogsUseCase = UseCaseAbstraction.createImplementation({
    implementation: ListTaskLogsUseCaseImpl,
    dependencies: [TaskLogsRepository]
});
