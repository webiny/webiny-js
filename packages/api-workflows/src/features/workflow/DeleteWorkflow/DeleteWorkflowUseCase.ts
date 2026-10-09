import { Result } from "@webiny/feature/api";
import { EventPublisher } from "@webiny/api-core/features/eventPublisher/index.js";
import { WorkflowRepository } from "~/domain/workflow/abstractions/WorkflowRepository.js";
import { ReviewRepository } from "~/domain/review/abstractions/ReviewRepository.js";
import {
    WorkflowHasActiveReviewsError,
    WorkflowPersistenceError
} from "~/domain/workflow/errors.js";
import { WorkflowAfterDeleteEvent, WorkflowBeforeDeleteEvent } from "./events.js";
import { DeleteWorkflowUseCase as UseCase } from "./abstractions.js";

class DeleteWorkflowUseCaseImpl implements UseCase.Interface {
    constructor(
        private repository: WorkflowRepository.Interface,
        private reviewRepository: ReviewRepository.Interface,
        private eventPublisher: EventPublisher.Interface
    ) {}

    async execute(input: UseCase.Input): UseCase.Return {
        const existing = await this.repository.get(input.id);
        if (existing.isFail()) {
            return Result.fail(existing.error);
        }
        const workflow = existing.value;

        // Finished reviews keep their snapshot and do not block the delete (D81).
        const inProgress = await this.reviewRepository.countInProgressByWorkflow(workflow.id);
        if (inProgress.isFail()) {
            return Result.fail(new WorkflowPersistenceError(inProgress.error));
        }
        if (inProgress.value > 0) {
            return Result.fail(new WorkflowHasActiveReviewsError({ count: inProgress.value }));
        }

        await this.eventPublisher.publish(new WorkflowBeforeDeleteEvent({ workflow }));

        const result = await this.repository.delete(workflow.id);
        if (result.isFail()) {
            return Result.fail(result.error);
        }

        await this.eventPublisher.publish(new WorkflowAfterDeleteEvent({ workflow }));
        return Result.ok(workflow);
    }
}

export const DeleteWorkflowUseCase = UseCase.createImplementation({
    implementation: DeleteWorkflowUseCaseImpl,
    dependencies: [WorkflowRepository, ReviewRepository, EventPublisher]
});
