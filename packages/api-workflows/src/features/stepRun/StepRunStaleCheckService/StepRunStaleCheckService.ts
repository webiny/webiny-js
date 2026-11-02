import { Result } from "@webiny/feature/api";
import { Logger } from "@webiny/api-core/features/logger/index.js";
import { ReviewRepository } from "~/domain/review/abstractions/ReviewRepository.js";
import { ReviewNotFoundError, ReviewPersistenceError } from "~/domain/review/errors.js";
import { getStaleStepRunReason } from "~/domain/review/getStaleStepRunReason.js";
import { StepRunStaleCheckService as Abstraction } from "./abstractions.js";
import { hasErrorSource } from "~/domain/hasErrorSource.js";

class StepRunStaleCheckServiceImpl implements Abstraction.Interface {
    public constructor(
        private repository: ReviewRepository.Interface,
        private logger: Logger.Interface
    ) {}

    public async isStale({
        reviewId,
        stepId,
        task
    }: Abstraction.Params): Promise<Result<boolean, ReviewPersistenceError>> {
        try {
            const current = await this.repository.get(reviewId);
            if (current.isFail()) {
                if (current.error instanceof ReviewNotFoundError) {
                    return Result.ok(true);
                }
                // Fail-closed: a failed read must not read as "not stale" for a caller that writes.
                this.logger.error(
                    {
                        err: hasErrorSource(current.error) ? current.error.source : current.error,
                        taskId: task.id,
                        reviewId,
                        stepId
                    },
                    "Could not read the review to check the step is current."
                );
                return Result.fail(
                    current.error instanceof ReviewPersistenceError
                        ? current.error
                        : new ReviewPersistenceError(current.error)
                );
            }
            return Result.ok(getStaleStepRunReason(current.value, stepId, task) !== null);
        } catch (error) {
            this.logger.error(
                { err: error, taskId: task.id, reviewId, stepId },
                "Could not read the review to check the step is current."
            );
            return Result.fail(new ReviewPersistenceError(error as Error));
        }
    }
}

export const StepRunStaleCheckService = Abstraction.createImplementation({
    implementation: StepRunStaleCheckServiceImpl,
    dependencies: [ReviewRepository, Logger]
});
