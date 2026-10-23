import { ReviewTargetSync } from "~/features/review/ReviewTargetSync/index.js";
import { ARTICLE_MODEL } from "./fixtures.js";

export const TARGET_SYNC_THROW = "The adapter crashed.";

/** A target adapter that throws instead of returning a failure. */
class ThrowingReviewTargetSyncImpl implements ReviewTargetSync.Interface {
    canSync(model: string): boolean {
        return model === ARTICLE_MODEL;
    }

    async sync(): ReviewTargetSync.Return {
        throw new Error(TARGET_SYNC_THROW);
    }
}

export const ThrowingReviewTargetSync = ReviewTargetSync.createImplementation({
    implementation: ThrowingReviewTargetSyncImpl,
    dependencies: []
});
