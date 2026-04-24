import { Result } from "@webiny/feature/api";
import { IdentityContext } from "@webiny/api-core/features/security/IdentityContext/index.js";
import { GetUserTeamsUseCase } from "~/features/internal/GetUserTeams/index.js";
import {
    ListWorkflowStatesRepository,
    ListWorkflowStatesUseCase as UseCase
} from "./abstractions.js";
import { WorkflowState } from "~/domain/workflowState/WorkflowState.js";

class ListWorkflowStatesUseCaseImpl implements UseCase.Interface {
    constructor(
        private identityContext: IdentityContext.Interface,
        private getUserTeams: GetUserTeamsUseCase.Interface,
        private repository: ListWorkflowStatesRepository.Interface
    ) {}

    async execute(params: UseCase.Params = {}): UseCase.Return {
        const identity = this.identityContext.getIdentity();

        const teamsResult = await this.getUserTeams.execute(identity.id);
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
