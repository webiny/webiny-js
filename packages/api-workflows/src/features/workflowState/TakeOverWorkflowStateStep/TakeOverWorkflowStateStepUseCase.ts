import { Result } from "@webiny/feature/api";
import { GetWorkflowStateUseCase } from "../GetWorkflowState/index.js";
import { UpdateWorkflowStateRepository } from "../UpdateWorkflowState/index.js";
import { TakeOverWorkflowStateStepUseCase as UseCase } from "./abstractions.js";
import { EventPublisher } from "@webiny/api-core/features/eventPublisher/index.js";
import { WorkflowStateTakeOverStepEvent } from "./events.js";

class TakeOverWorkflowStateStepUseCaseImpl implements UseCase.Interface {
    constructor(
        private getWorkflowState: GetWorkflowStateUseCase.Interface,
        private repository: UpdateWorkflowStateRepository.Interface,
        private eventPublisher: EventPublisher.Interface
    ) {}

    async execute(id: string): UseCase.Return {
        const stateResult = await this.getWorkflowState.execute(id);
        if (stateResult.isFail()) {
            return Result.fail(stateResult.error);
        }

        const state = stateResult.value;

        const takeOverResult = state.takeOver();
        if (takeOverResult.isFail()) {
            return Result.fail(takeOverResult.error);
        }

        const updatedRecord = state.toRecord();

        const updateResult = await this.repository.execute(id, updatedRecord);
        if (updateResult.isFail()) {
            return Result.fail(updateResult.error);
        }

        await this.eventPublisher.publish(
            new WorkflowStateTakeOverStepEvent({
                state
            })
        );

        return Result.ok(state);
    }
}

export const TakeOverWorkflowStateStepUseCase = UseCase.createImplementation({
    implementation: TakeOverWorkflowStateStepUseCaseImpl,
    dependencies: [GetWorkflowStateUseCase, UpdateWorkflowStateRepository, EventPublisher]
});
