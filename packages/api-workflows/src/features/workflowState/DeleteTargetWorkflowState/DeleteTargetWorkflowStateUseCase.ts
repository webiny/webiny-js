import { Result } from "@webiny/feature/api";
import { IdentityContext } from "@webiny/api-core/features/security/IdentityContext/index.js";
import { GetUserTeamsUseCase } from "~/features/internal/GetUserTeams/index.js";
import { EventPublisher } from "@webiny/api-core/features/eventPublisher/index.js";
import { GetWorkflowUseCase } from "~/features/workflow/GetWorkflow/index.js";
import { GetTargetWorkflowStateUseCase } from "../GetTargetWorkflowState/index.js";
import { DeleteWorkflowStateRepository } from "../DeleteWorkflowState/index.js";
import { DeleteTargetWorkflowStateUseCase as UseCase } from "./abstractions.js";
import { WorkflowStateAfterDeleteEvent } from "./events.js";
import { WorkflowState } from "~/domain/workflowState/WorkflowState.js";
import { WorkflowNotFoundError } from "~/domain/workflow/errors.js";

class DeleteTargetWorkflowStateUseCaseImpl implements UseCase.Interface {
    constructor(
        private identityContext: IdentityContext.Interface,
        private getUserTeams: GetUserTeamsUseCase.Interface,
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
        const teamsResult = await this.getUserTeams.execute(identity.id);
        const teams = teamsResult.value;
        const state = new WorkflowState(record, teams, identity);

        await this.eventPublisher.publish(
            new WorkflowStateAfterDeleteEvent({
                state
            })
        );

        return Result.ok();
    }
}

export const DeleteTargetWorkflowStateUseCase = UseCase.createImplementation({
    implementation: DeleteTargetWorkflowStateUseCaseImpl,
    dependencies: [
        IdentityContext,
        GetUserTeamsUseCase,
        EventPublisher,
        GetWorkflowUseCase,
        GetTargetWorkflowStateUseCase,
        DeleteWorkflowStateRepository
    ]
});
