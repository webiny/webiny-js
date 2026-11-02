import { Result } from "@webiny/feature/api";
import { getStaleStepRunReason } from "@webiny/api-workflows/domain/review/getStaleStepRunReason.js";
import type { ReviewPersistenceError } from "@webiny/api-workflows/domain/review/errors.js";
import type { ReviewData } from "@webiny/api-workflows/domain/review/types.js";
import type { StepRunStaleCheckService } from "@webiny/api-workflows/features/stepRun/StepRunStaleCheckService/index.js";

/** The stored review, replaced by the test to cancel or restart it during the model call. */
export interface StoredReview {
    review: ReviewData;
}

/**
 * `StepRunStaleCheckService` over the stored review with the real guard. `calls` records every
 * read; set `failure` to answer a failed Result (the real service is fail-closed and logs its own
 * failures, so the fake logs nothing). `afterRead` runs after a guard read with its answer, before
 * the runner gets it: flip the stored review or move the clock between two checks of one step.
 */
export class StoredReviewStaleCheck implements StepRunStaleCheckService.Interface {
    public readonly calls: StepRunStaleCheckService.Params[] = [];
    public failure: ReviewPersistenceError | null = null;
    public throws: Error | null = null;
    public afterRead: ((stale: boolean) => void) | null = null;

    public constructor(private store: StoredReview) {}

    public async isStale(
        params: StepRunStaleCheckService.Params
    ): Promise<Result<boolean, ReviewPersistenceError>> {
        this.calls.push(params);
        if (this.throws) {
            throw this.throws;
        }
        if (this.failure) {
            return Result.fail(this.failure);
        }
        const stale = getStaleStepRunReason(this.store.review, params.stepId, params.task) !== null;
        this.afterRead?.(stale);
        return Result.ok(stale);
    }
}
