import { Result } from "@webiny/feature/api";
import { IdentityContext } from "@webiny/api-core/features/IdentityContext";
import { ListUserTeamsUseCase } from "@webiny/api-core/features/users/ListUserTeams";
import { GetWorkflowStateRepository, GetWorkflowStateUseCase as UseCase } from "./abstractions.js";
import { WorkflowState } from "~/domain/workflowState/WorkflowState.js";
import type { IWorkflowStepTeam } from "~/domain/workflow/abstractions.js";

class GetWorkflowStateUseCaseImpl implements UseCase.Interface {
    constructor(
        private identityContext: IdentityContext.Interface,
        private listUserTeams: ListUserTeamsUseCase.Interface,
        private repository: GetWorkflowStateRepository.Interface
    ) {}

    async execute(input: UseCase.Params): UseCase.Return {
        const recordResult = await this.repository.execute(input);

        if (recordResult.isFail()) {
            return Result.fail(recordResult.error);
        }

        const record = recordResult.value;

        const identity = this.identityContext.getIdentity();

        const teams = await this.getUserTeams(identity.id);

        const workflowState = new WorkflowState(record, teams, identity);

        return Result.ok(workflowState);
    }

    private async getUserTeams(id: string): Promise<IWorkflowStepTeam[]> {
        const result = await this.listUserTeams.execute(id);

        if (result.isFail()) {
            // If fetching teams fails, return an empty array (user has no teams)
            return [];
        }

        return result.value.map(team => ({ id: team.id }));
    }
}

export const GetWorkflowStateUseCase = UseCase.createImplementation({
    implementation: GetWorkflowStateUseCaseImpl,
    dependencies: [IdentityContext, ListUserTeamsUseCase, GetWorkflowStateRepository]
});
