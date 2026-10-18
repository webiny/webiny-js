import { Result } from "@webiny/feature/api";
import { GetTaskUseCase } from "@webiny/background-tasks/api/features/GetTask/index.js";
import { ReviewRepository } from "~/domain/review/abstractions/ReviewRepository.js";
import { ReviewPersistenceError, ReviewStepRunNotFoundError } from "~/domain/review/errors.js";
import { GetReviewStepRunUseCase as UseCase } from "./abstractions.js";
import { toReviewStepRunInfo } from "./toReviewStepRunInfo.js";

class GetReviewStepRunUseCaseImpl implements UseCase.Interface {
    constructor(
        private repository: ReviewRepository.Interface,
        private getTask: GetTaskUseCase.Interface
    ) {}

    async execute(input: UseCase.Input): UseCase.Return {
        const loaded = await this.repository.get(input.reviewId);
        if (loaded.isFail()) {
            return Result.fail(loaded.error);
        }

        // Only the step's own task ids are read: its current task or one of its earlier runs.
        // Any other id, another step's or another review's, is refused before the task is read.
        const step = loaded.value.steps.find(item => item.id === input.stepId);
        const isCurrent = step?.taskId === input.taskId;
        const isEarlier = step?.runs.some(run => run.taskId === input.taskId);
        if (!step || !(isCurrent || isEarlier)) {
            return Result.fail(
                new ReviewStepRunNotFoundError({
                    reviewId: input.reviewId,
                    stepId: input.stepId,
                    taskId: input.taskId
                })
            );
        }

        let task: Awaited<GetTaskUseCase.Return>;
        try {
            task = await this.getTask.execute(input.taskId);
        } catch (error) {
            const cause = error instanceof Error ? error : new Error(String(error));
            return Result.fail(new ReviewPersistenceError(cause));
        }
        if (!task) {
            return Result.ok(null);
        }

        const info = toReviewStepRunInfo({ step, taskId: input.taskId, task });
        return Result.ok(info);
    }
}

export const GetReviewStepRunUseCase = UseCase.createImplementation({
    implementation: GetReviewStepRunUseCaseImpl,
    dependencies: [ReviewRepository, GetTaskUseCase]
});
