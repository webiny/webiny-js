import { Result } from "@webiny/feature/api";
import { IdentityContext } from "@webiny/api-core/features/security/IdentityContext/index.js";
import { GetUserTeamsUseCase } from "~/features/internal/GetUserTeams/index.js";
import { GetWorkflowStateRepository, GetWorkflowStateUseCase as UseCase } from "./abstractions.js";
import { WorkflowState } from "~/domain/workflowState/WorkflowState.js";

class GetWorkflowStateUseCaseImpl implements UseCase.Interface {
    constructor(
        private identityContext: IdentityContext.Interface,
        private getUserTeams: GetUserTeamsUseCase.Interface,
        private repository: GetWorkflowStateRepository.Interface
    ) {}

    async execute(id: string): UseCase.Return {
        const recordResult = await this.repository.execute(id);

        if (recordResult.isFail()) {
            return Result.fail(recordResult.error);
        }

        const record = recordResult.value;

        const identity = this.identityContext.getIdentity();

        const teamsResult = await this.getUserTeams.execute(identity.id);
        const teams = teamsResult.value;

        const workflowState = new WorkflowState(record, teams, identity);

        return Result.ok(workflowState);
    }
}

export const GetWorkflowStateUseCase = UseCase.createImplementation({
    implementation: GetWorkflowStateUseCaseImpl,
    dependencies: [IdentityContext, GetUserTeamsUseCase, GetWorkflowStateRepository]
});
