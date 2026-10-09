import { Result } from "@webiny/feature/api";
import { ReviewTargetSync } from "~/features/review/ReviewTargetSync/index.js";

export const TARGET_SYNC_FAILURE = "The target revision is locked.";

/** A target adapter whose write fails (R16), e.g. the target revision was deleted meanwhile. */
class FailingReviewTargetSyncImpl implements ReviewTargetSync.Interface {
    constructor(private decoratee: ReviewTargetSync.Interface) {}

    async sync(params: ReviewTargetSync.Params): ReviewTargetSync.Return {
        await this.decoratee.sync(params);
        return Result.fail(new Error(TARGET_SYNC_FAILURE));
    }
}

export const FailingReviewTargetSync = ReviewTargetSync.createDecorator({
    decorator: FailingReviewTargetSyncImpl,
    dependencies: []
});
