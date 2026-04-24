import { Result } from "@webiny/feature/api";
import { parseIdentifier } from "@webiny/utils/parseIdentifier.js";
import { IdentityContext } from "@webiny/api-core/features/security/IdentityContext/index.js";
import { GetUserTeamsUseCase } from "~/features/internal/GetUserTeams/index.js";
import {
    GetTargetWorkflowStateRepository,
    GetTargetWorkflowStateUseCase as UseCase
} from "./abstractions.js";
import { WorkflowState } from "~/domain/workflowState/WorkflowState.js";
import { WorkflowStateValidationError } from "~/domain/workflowState/errors.js";

class GetTargetWorkflowStateUseCaseImpl implements UseCase.Interface {
    constructor(
        private identityContext: IdentityContext.Interface,
        private getUserTeams: GetUserTeamsUseCase.Interface,
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

        const teamsResult = await this.getUserTeams.execute(identity.id);
        const teams = teamsResult.value;

        const workflowState = new WorkflowState(record, teams, identity);

        return Result.ok(workflowState);
    }
}

export const GetTargetWorkflowStateUseCase = UseCase.createImplementation({
    implementation: GetTargetWorkflowStateUseCaseImpl,
    dependencies: [IdentityContext, GetUserTeamsUseCase, GetTargetWorkflowStateRepository]
});
