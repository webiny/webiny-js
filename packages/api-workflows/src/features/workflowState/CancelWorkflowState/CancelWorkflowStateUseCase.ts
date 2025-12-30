import { UpdateWorkflowStateUseCase } from "../UpdateWorkflowState/index.js";
import { CancelWorkflowStateUseCase as UseCase } from "./abstractions.js";
import { Result } from "@webiny/feature/api";
import { EventPublisher } from "@webiny/api-core/features/eventPublisher/index.js";
import { WorkflowStateCancelEvent } from "~/features/workflowState/CancelWorkflowState/events.js";

class CancelWorkflowStateUseCaseImpl implements UseCase.Interface {
    constructor(
        private updateWorkflowState: UpdateWorkflowStateUseCase.Interface,
        private eventPublisher: EventPublisher.Interface
    ) {}

    async execute(id: string): UseCase.Return {
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
    dependencies: [UpdateWorkflowStateUseCase, EventPublisher]
});
