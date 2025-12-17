import { Result } from "@webiny/feature/api";
import { IdentityContext } from "@webiny/api-core/features/IdentityContext";
import { ListUserTeamsUseCase } from "@webiny/api-core/features/users/ListUserTeams";
import {
    ListWorkflowStatesRepository,
    ListWorkflowStatesUseCase as UseCase
} from "./abstractions.js";
import { WorkflowState } from "~/domain/workflowState/WorkflowState.js";
import type { IWorkflowStepTeam } from "~/domain/workflow/abstractions.js";

class ListWorkflowStatesUseCaseImpl implements UseCase.Interface {
    constructor(
        private identityContext: IdentityContext.Interface,
        private listUserTeams: ListUserTeamsUseCase.Interface,
        private repository: ListWorkflowStatesRepository.Interface
    ) {}

    async execute(params: UseCase.Params = {}): UseCase.Return {
        const identity = this.identityContext.getIdentity();

        const teams = await this.getUserTeams(identity.id);

        const recordsResult = await this.repository.execute(params);

        if (recordsResult.isFail()) {
            return Result.fail(recordsResult.error);
        }

        const { items: records, meta } = recordsResult.value;

        const items = records.map(record => new WorkflowState(record, teams, identity));

        return Result.ok({
            items,
            meta
        });
    }

    private async getUserTeams(id: string): Promise<IWorkflowStepTeam[]> {
        const result = await this.listUserTeams.execute(id);

        if (result.isFail()) {
            return [];
        }

        return result.value.map(team => ({
            id: team.id
        }));
    }
}

export const ListWorkflowStatesUseCase = UseCase.createImplementation({
    implementation: ListWorkflowStatesUseCaseImpl,
    dependencies: [IdentityContext, ListUserTeamsUseCase, ListWorkflowStatesRepository]
});
