import { ListVisibleTasksUseCase as UseCaseAbstraction } from "./abstractions.js";
import { ListTasksUseCase } from "~/api/features/ListTasks/abstractions.js";
import { PrivateTaskDefinitions } from "~/api/features/PrivateTaskDefinitions/abstractions.js";
import type { IListTaskParams } from "~/api/types.js";

class ListVisibleTasksUseCaseImpl implements UseCaseAbstraction.Interface {
    public constructor(
        private readonly listTasks: ListTasksUseCase.Interface,
        private readonly privateDefinitions: PrivateTaskDefinitions.Interface
    ) {}

    public async execute(params?: IListTaskParams) {
        const privateIds = this.privateDefinitions.getIds();
        if (privateIds.length === 0) {
            return this.listTasks.execute(params);
        }
        // The caller's own `definitionId_not_in` is kept.
        return this.listTasks.execute({
            ...params,
            where: {
                ...params?.where,
                definitionId_not_in: [...(params?.where?.definitionId_not_in || []), ...privateIds]
            }
        });
    }
}

export const ListVisibleTasksUseCase = UseCaseAbstraction.createImplementation({
    implementation: ListVisibleTasksUseCaseImpl,
    dependencies: [ListTasksUseCase, PrivateTaskDefinitions]
});
