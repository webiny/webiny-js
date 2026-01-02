import { Result } from "@webiny/feature/api";
import { GetWorkflowStateUseCase } from "../GetWorkflowState/index.js";
import {
    DeleteWorkflowStateRepository,
    DeleteWorkflowStateUseCase as UseCase
} from "./abstractions.js";
import { WorkflowStateAfterDeleteEvent } from "~/features/workflowState/DeleteTargetWorkflowState/events.js";
import { EventPublisher } from "@webiny/api-core/features/eventPublisher/index.js";

class DeleteWorkflowStateUseCaseImpl implements UseCase.Interface {
    constructor(
        private getWorkflowState: GetWorkflowStateUseCase.Interface,
        private repository: DeleteWorkflowStateRepository.Interface,
        private eventPublisher: EventPublisher.Interface
    ) {}

    async execute(id: string): UseCase.Return {
        const stateResult = await this.getWorkflowState.execute(id);
        if (stateResult.isFail()) {
            return Result.fail(stateResult.error);
        }

        const result = await this.repository.execute(id);
        if (result.isFail()) {
            return result;
        }

        await this.eventPublisher.publish(
            new WorkflowStateAfterDeleteEvent({
                state: stateResult.value
            })
        );

        return Result.ok();
    }
}

export const DeleteWorkflowStateUseCase = UseCase.createImplementation({
    implementation: DeleteWorkflowStateUseCaseImpl,
    dependencies: [GetWorkflowStateUseCase, DeleteWorkflowStateRepository, EventPublisher]
});
