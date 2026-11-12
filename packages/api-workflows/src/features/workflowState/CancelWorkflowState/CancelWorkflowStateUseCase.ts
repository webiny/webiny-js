import { IdentityContext } from "@webiny/api-core/features/security/IdentityContext/index.js";
import { UpdateWorkflowStateUseCase } from "../UpdateWorkflowState/index.js";
import { GetWorkflowStateUseCase } from "../GetWorkflowState/index.js";
import { CancelWorkflowStateUseCase as UseCase } from "./abstractions.js";
import { Result } from "@webiny/feature/api";
import { EventPublisher } from "@webiny/api-core/features/eventPublisher/index.js";
import { WorkflowStateCancelEvent } from "~/features/workflowState/CancelWorkflowState/events.js";
import { WorkflowStateNotAuthorizedError } from "~/domain/workflowState/errors.js";
import { canManageWorkflows } from "~/features/shared/canManageWorkflows.js";

class CancelWorkflowStateUseCaseImpl implements UseCase.Interface {
    constructor(
        private identityContext: IdentityContext.Interface,
        private getWorkflowState: GetWorkflowStateUseCase.Interface,
        private updateWorkflowState: UpdateWorkflowStateUseCase.Interface,
        private eventPublisher: EventPublisher.Interface
    ) {}

    async execute(id: string): UseCase.Return {
        const stateResult = await this.getWorkflowState.execute(id);
        if (stateResult.isFail()) {
            return Result.fail(stateResult.error);
        }

        // Only the identity which requested the review, or one that manages workflows (incl. full
        // access), may cancel it. Background work runs without authorization and keeps access.
        if (this.identityContext.isAuthorizationEnabled()) {
            const identity = this.identityContext.getIdentity();
            const isCreator = stateResult.value.createdBy?.id === identity.id;
            if (!isCreator && !(await canManageWorkflows(this.identityContext))) {
                return Result.fail(
                    new WorkflowStateNotAuthorizedError("You cannot cancel this workflow state.")
                );
            }
        }

        const result = await this.updateWorkflowState.execute(id, {
            isActive: false
        });
        if (result.isFail()) {
            return Result.fail(result.error);
        }

        await this.eventPublisher.publish(
            new WorkflowStateCancelEvent({
                state: result.value
            })
        );

        return result;
    }
}

export const CancelWorkflowStateUseCase = UseCase.createImplementation({
    implementation: CancelWorkflowStateUseCaseImpl,
    dependencies: [
        IdentityContext,
        GetWorkflowStateUseCase,
        UpdateWorkflowStateUseCase,
        EventPublisher
    ]
});
