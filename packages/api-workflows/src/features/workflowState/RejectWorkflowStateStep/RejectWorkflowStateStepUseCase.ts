import { Result } from "@webiny/feature/api";
import { GetWorkflowStateUseCase } from "../GetWorkflowState/index.js";
import { UpdateWorkflowStateRepository } from "../UpdateWorkflowState/index.js";
import { RejectWorkflowStateStepUseCase as UseCase } from "./abstractions.js";
import { WorkflowStateRejectEvent } from "./events.js";
import { EventPublisher } from "@webiny/api-core/features/eventPublisher/index.js";

class RejectWorkflowStateStepUseCaseImpl implements UseCase.Interface {
    constructor(
        private getWorkflowState: GetWorkflowStateUseCase.Interface,
        private repository: UpdateWorkflowStateRepository.Interface,
        private eventPublisher: EventPublisher.Interface
    ) {}

    async execute(id: string, comment: string): UseCase.Return {
        const stateResult = await this.getWorkflowState.execute(id);
        if (stateResult.isFail()) {
            return Result.fail(stateResult.error);
        }

        const state = stateResult.value;

        const rejectResult = state.reject(comment);
        if (rejectResult.isFail()) {
            return Result.fail(rejectResult.error);
        }

        const updatedRecord = state.toRecord();

        const updateResult = await this.repository.execute(id, updatedRecord);
        if (updateResult.isFail()) {
            return Result.fail(updateResult.error);
        }

        await this.eventPublisher.publish(
            new WorkflowStateRejectEvent({
                state
            })
        );

        return Result.ok(state);
    }
}

export const RejectWorkflowStateStepUseCase = UseCase.createImplementation({
    implementation: RejectWorkflowStateStepUseCaseImpl,
    dependencies: [GetWorkflowStateUseCase, UpdateWorkflowStateRepository, EventPublisher]
});
