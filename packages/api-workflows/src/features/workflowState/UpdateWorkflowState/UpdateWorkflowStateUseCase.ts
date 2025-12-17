import { Result } from "@webiny/feature/api";
import { IdentityContext } from "@webiny/api-core/features/IdentityContext";
import { ListUserTeamsUseCase } from "@webiny/api-core/features/users/ListUserTeams";
import { EventPublisher } from "@webiny/api-core/features/EventPublisher";
import { GetWorkflowUseCase } from "~/features/workflow/GetWorkflow/index.js";
import { GetWorkflowStateUseCase } from "../GetWorkflowState/index.js";
import {
    UpdateWorkflowStateRepository,
    UpdateWorkflowStateUseCase as UseCase
} from "./abstractions.js";
import { WorkflowStateAfterUpdateEvent } from "./events.js";
import { WorkflowState } from "~/domain/workflowState/WorkflowState.js";
import { WorkflowNotFoundError } from "~/domain/workflow/errors.js";
import type { IWorkflowStepTeam } from "~/domain/workflow/abstractions.js";

class UpdateWorkflowStateUseCaseImpl implements UseCase.Interface {
    constructor(
        private identityContext: IdentityContext.Interface,
        private listUserTeams: ListUserTeamsUseCase.Interface,
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
        const teams = await this.getUserTeams(identity.id);
        const updatedState = new WorkflowState(updatedRecord, teams, identity);

        await this.eventPublisher.publish(
            new WorkflowStateAfterUpdateEvent({
                state: updatedState,
                original: originalState
            })
        );

        return Result.ok(updatedState);
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

export const UpdateWorkflowStateUseCase = UseCase.createImplementation({
    implementation: UpdateWorkflowStateUseCaseImpl,
    dependencies: [
        IdentityContext,
        ListUserTeamsUseCase,
        EventPublisher,
        GetWorkflowUseCase,
        GetWorkflowStateUseCase,
        UpdateWorkflowStateRepository
    ]
});
