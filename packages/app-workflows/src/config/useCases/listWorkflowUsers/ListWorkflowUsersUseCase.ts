import { WorkflowConfigRepository } from "~/config/repository/abstractions.js";
import type { WorkflowUserList } from "~/editor/domain/types.js";
import { ListWorkflowUsersUseCase as UseCaseAbstraction } from "./abstractions.js";

class ListWorkflowUsersUseCaseImpl implements UseCaseAbstraction.Interface {
    constructor(private repository: WorkflowConfigRepository.Interface) {}

    public execute(params: UseCaseAbstraction.Params): Promise<WorkflowUserList> {
        return this.repository.listUsers(params);
    }
}

export const ListWorkflowUsersUseCase = UseCaseAbstraction.createImplementation({
    implementation: ListWorkflowUsersUseCaseImpl,
    dependencies: [WorkflowConfigRepository]
});
