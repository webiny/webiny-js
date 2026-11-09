import { Result } from "@webiny/feature/api";
import { IdentityContext } from "@webiny/api-core/features/security/IdentityContext/index.js";
import { GetUserTeamsUseCase } from "~/features/internal/GetUserTeams/index.js";
import {
    ListWorkflowStatesRepository,
    ListWorkflowStatesUseCase as UseCase
} from "./abstractions.js";
import { WorkflowState } from "~/domain/workflowState/WorkflowState.js";
import { WorkflowStateNotAuthorizedError } from "~/domain/workflowState/errors.js";

class ListWorkflowStatesUseCaseImpl implements UseCase.Interface {
    constructor(
        private identityContext: IdentityContext.Interface,
        private getUserTeams: GetUserTeamsUseCase.Interface,
        private repository: ListWorkflowStatesRepository.Interface
    ) {}

    async execute(params: UseCase.Params = {}): UseCase.Return {
        /* Workflow states can't be read anonymously. Background work (tasks, scheduler) runs
           without authorization and keeps access. */
        if (
            this.identityContext.isAuthorizationEnabled() &&
            this.identityContext.getIdentity().isAnonymous()
        ) {
            return Result.fail(new WorkflowStateNotAuthorizedError("Not authorized!"));
        }

        const identity = this.identityContext.getIdentity();

        const teamsResult = await this.getUserTeams.execute(identity.id);
        if (teamsResult.isFail()) {
            return Result.fail(teamsResult.error);
        }
        const teams = teamsResult.value;

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
}

export const ListWorkflowStatesUseCase = UseCase.createImplementation({
    implementation: ListWorkflowStatesUseCaseImpl,
    dependencies: [IdentityContext, GetUserTeamsUseCase, ListWorkflowStatesRepository]
});
