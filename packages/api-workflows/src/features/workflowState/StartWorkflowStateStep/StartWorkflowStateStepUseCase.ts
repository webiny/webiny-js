import { Result } from "@webiny/feature/api";
import { GetWorkflowStateUseCase } from "../GetWorkflowState/index.js";
import { UpdateWorkflowStateRepository } from "../UpdateWorkflowState/index.js";
import { StartWorkflowStateStepUseCase as UseCase } from "./abstractions.js";
import { WorkflowStateStartStepEvent } from "./events.js";
import { EventPublisher } from "@webiny/api-core/features/eventPublisher/index.js";

class StartWorkflowStateStepUseCaseImpl implements UseCase.Interface {
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

        const startResult = state.start();
        if (startResult.isFail()) {
            return Result.fail(startResult.error);
        }

        const updatedRecord = state.toRecord();

        const updateResult = await this.repository.execute(id, updatedRecord);
        if (updateResult.isFail()) {
            return Result.fail(updateResult.error);
        }

        await this.eventPublisher.publish(
            new WorkflowStateStartStepEvent({
                state
            })
        );

        return Result.ok(state);
    }
}

export const StartWorkflowStateStepUseCase = UseCase.createImplementation({
    implementation: StartWorkflowStateStepUseCaseImpl,
    dependencies: [GetWorkflowStateUseCase, UpdateWorkflowStateRepository, EventPublisher]
});
