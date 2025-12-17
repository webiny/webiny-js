import { Result } from "@webiny/feature/api";
import { IdentityContext } from "@webiny/api-core/features/IdentityContext";
import { ListUserTeamsUseCase } from "@webiny/api-core/features/users/ListUserTeams";
import { EventPublisher } from "@webiny/api-core/features/EventPublisher";
import { GetWorkflowUseCase } from "~/features/workflow/GetWorkflow/index.js";
import { GetTargetWorkflowStateUseCase } from "../GetTargetWorkflowState/index.js";
import { DeleteWorkflowStateRepository } from "../DeleteWorkflowState/index.js";
import { DeleteTargetWorkflowStateUseCase as UseCase } from "./abstractions.js";
import { WorkflowStateAfterDeleteEvent } from "./events.js";
import { WorkflowState } from "~/domain/workflowState/WorkflowState.js";
import { WorkflowNotFoundError } from "~/domain/workflow/errors.js";
import type { IWorkflowStepTeam } from "~/domain/workflow/abstractions.js";

class DeleteTargetWorkflowStateUseCaseImpl implements UseCase.Interface {
    constructor(
        private identityContext: IdentityContext.Interface,
        private listUserTeams: ListUserTeamsUseCase.Interface,
        private eventPublisher: EventPublisher.Interface,
        private getWorkflow: GetWorkflowUseCase.Interface,
        private getTargetWorkflowState: GetTargetWorkflowStateUseCase.Interface,
        private repository: DeleteWorkflowStateRepository.Interface
    ) {}

    async execute(app: string, targetRevisionId: string): UseCase.Return {
        const stateResult = await this.getTargetWorkflowState.execute({ app, targetRevisionId });
        if (stateResult.isFail()) {
            return Result.ok();
        }

        const record = stateResult.value;

        const workflowResult = await this.getWorkflow.execute({
            app: record.app,
            id: record.workflowId
        });

        if (workflowResult.isFail()) {
            return Result.fail(
                new WorkflowNotFoundError({
                    id: record.workflowId,
                    app: record.app
                })
            );
        }

        const deleteResult = await this.repository.execute(record.id);
        if (deleteResult.isFail()) {
            return deleteResult;
        }

        const identity = this.identityContext.getIdentity();
        const teams = await this.getUserTeams(identity.id);
        const state = new WorkflowState(record, teams, identity);

        await this.eventPublisher.publish(
            new WorkflowStateAfterDeleteEvent({
                state
            })
        );

        return Result.ok();
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

export const DeleteTargetWorkflowStateUseCase = UseCase.createImplementation({
    implementation: DeleteTargetWorkflowStateUseCaseImpl,
    dependencies: [
        IdentityContext,
        ListUserTeamsUseCase,
        EventPublisher,
        GetWorkflowUseCase,
        GetTargetWorkflowStateUseCase,
        DeleteWorkflowStateRepository
    ]
});
