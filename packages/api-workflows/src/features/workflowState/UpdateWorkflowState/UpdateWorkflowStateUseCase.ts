import { Result } from "@webiny/feature/api";
import { IdentityContext } from "@webiny/api-core/features/security/IdentityContext/index.js";
import { GetUserTeamsUseCase } from "~/features/internal/GetUserTeams/index.js";
import { EventPublisher } from "@webiny/api-core/features/eventPublisher/index.js";
import { GetWorkflowUseCase } from "~/features/workflow/GetWorkflow/index.js";
import { GetWorkflowStateUseCase } from "../GetWorkflowState/index.js";
import {
    UpdateWorkflowStateRepository,
    UpdateWorkflowStateUseCase as UseCase
} from "./abstractions.js";
import { WorkflowStateAfterUpdateEvent } from "./events.js";
import { WorkflowState } from "~/domain/workflowState/WorkflowState.js";
import { WorkflowNotFoundError } from "~/domain/workflow/errors.js";

class UpdateWorkflowStateUseCaseImpl implements UseCase.Interface {
    constructor(
        private identityContext: IdentityContext.Interface,
        private getUserTeams: GetUserTeamsUseCase.Interface,
        private eventPublisher: EventPublisher.Interface,
        private getWorkflow: GetWorkflowUseCase.Interface,
        private getWorkflowState: GetWorkflowStateUseCase.Interface,
        private repository: UpdateWorkflowStateRepository.Interface
    ) {}

    async execute(id: string, input: UseCase.Input): UseCase.Return {
        const originalStateResult = await this.getWorkflowState.execute(id);
        if (originalStateResult.isFail()) {
            return Result.fail(originalStateResult.error);
        }

        const originalState = originalStateResult.value;

        const workflowResult = await this.getWorkflow.execute({
            app: originalState.app,
            id: originalState.workflowId
        });

        if (workflowResult.isFail()) {
            return Result.fail(
                new WorkflowNotFoundError({
                    id: originalState.workflowId,
                    app: originalState.app
                })
            );
        }

        const updateResult = await this.repository.execute(id, input);
        if (updateResult.isFail()) {
            return Result.fail(updateResult.error);
        }

        const updatedRecord = updateResult.value;

        const identity = this.identityContext.getIdentity();
        const teamsResult = await this.getUserTeams.execute(identity.id);
        const teams = teamsResult.value;
        const updatedState = new WorkflowState(updatedRecord, teams, identity);

        await this.eventPublisher.publish(
            new WorkflowStateAfterUpdateEvent({
                state: updatedState,
                original: originalState
            })
        );

        return Result.ok(updatedState);
    }
}

export const UpdateWorkflowStateUseCase = UseCase.createImplementation({
    implementation: UpdateWorkflowStateUseCaseImpl,
    dependencies: [
        IdentityContext,
        GetUserTeamsUseCase,
        EventPublisher,
        GetWorkflowUseCase,
        GetWorkflowStateUseCase,
        UpdateWorkflowStateRepository
    ]
});
