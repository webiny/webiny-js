import { Result } from "@webiny/feature/api";
import { parseIdentifier } from "@webiny/utils/parseIdentifier.js";
import { IdentityContext } from "@webiny/api-core/features/IdentityContext";
import { ListUserTeamsUseCase } from "@webiny/api-core/features/users/ListUserTeams";
import {
    GetTargetWorkflowStateRepository,
    GetTargetWorkflowStateUseCase as UseCase
} from "./abstractions.js";
import { WorkflowState } from "~/domain/workflowState/WorkflowState.js";
import { WorkflowStateValidationError } from "~/domain/workflowState/errors.js";
import type { IWorkflowStepTeam } from "~/domain/workflow/abstractions.js";

class GetTargetWorkflowStateUseCaseImpl implements UseCase.Interface {
    constructor(
        private identityContext: IdentityContext.Interface,
        private listUserTeams: ListUserTeamsUseCase.Interface,
        private repository: GetTargetWorkflowStateRepository.Interface
    ) {}

    async execute(input: UseCase.Params): UseCase.Return {
        const { version } = parseIdentifier(input.targetRevisionId);
        if (!version) {
            return Result.fail(
                new WorkflowStateValidationError(
                    "Cannot get a workflow state without version of a target record."
                )
            );
        }

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
            return [];
        }

        return result.value.map(team => ({
            id: team.id
        }));
    }
}

export const GetTargetWorkflowStateUseCase = UseCase.createImplementation({
    implementation: GetTargetWorkflowStateUseCaseImpl,
    dependencies: [IdentityContext, ListUserTeamsUseCase, GetTargetWorkflowStateRepository]
});
