import { WorkflowConfigRepository } from "~/config/repository/abstractions.js";
import type { WorkflowTeamList } from "~/editor/domain/types.js";
import { ListWorkflowTeamsUseCase as UseCaseAbstraction } from "./abstractions.js";

class ListWorkflowTeamsUseCaseImpl implements UseCaseAbstraction.Interface {
    constructor(private repository: WorkflowConfigRepository.Interface) {}

    public execute(params: UseCaseAbstraction.Params): Promise<WorkflowTeamList> {
        return this.repository.listTeams(params);
    }
}

export const ListWorkflowTeamsUseCase = UseCaseAbstraction.createImplementation({
    implementation: ListWorkflowTeamsUseCaseImpl,
    dependencies: [WorkflowConfigRepository]
});
