import { Result } from "@webiny/feature/api";
import { IdentityContext } from "@webiny/api-core/features/security/IdentityContext/index.js";
import { GetUserTeamsUseCase } from "~/features/internal/GetUserTeams/index.js";
import { GetWorkflowStateRepository, GetWorkflowStateUseCase as UseCase } from "./abstractions.js";
import { WorkflowState } from "~/domain/workflowState/WorkflowState.js";
import { WorkflowStateNotAuthorizedError } from "~/domain/workflowState/errors.js";

class GetWorkflowStateUseCaseImpl implements UseCase.Interface {
    constructor(
        private identityContext: IdentityContext.Interface,
        private getUserTeams: GetUserTeamsUseCase.Interface,
        private repository: GetWorkflowStateRepository.Interface
    ) {}

    async execute(id: string): UseCase.Return {
        /* Workflow states can't be read anonymously. Background work (tasks, scheduler) runs
           without authorization and keeps access. */
        if (
            this.identityContext.isAuthorizationEnabled() &&
            this.identityContext.getIdentity().isAnonymous()
        ) {
            return Result.fail(new WorkflowStateNotAuthorizedError("Not authorized!"));
        }

        const recordResult = await this.repository.execute(id);

        if (recordResult.isFail()) {
            return Result.fail(recordResult.error);
        }

        const record = recordResult.value;

        const identity = this.identityContext.getIdentity();

        const teamsResult = await this.getUserTeams.execute(identity.id);
        if (teamsResult.isFail()) {
            return Result.fail(teamsResult.error);
        }
        const teams = teamsResult.value;

        const workflowState = new WorkflowState(record, teams, identity);

        return Result.ok(workflowState);
    }
}

export const GetWorkflowStateUseCase = UseCase.createImplementation({
    implementation: GetWorkflowStateUseCaseImpl,
    dependencies: [IdentityContext, GetUserTeamsUseCase, GetWorkflowStateRepository]
});
