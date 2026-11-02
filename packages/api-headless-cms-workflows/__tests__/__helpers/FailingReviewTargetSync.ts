import type { Container } from "@webiny/di";
import { Result } from "@webiny/feature/api";
import { ReviewTargetSync } from "@webiny/api-workflows/features/review/ReviewTargetSync/index.js";

export const TARGET_SYNC_FAILURE = "The target revision is locked.";

class FailingReviewTargetSyncImpl implements ReviewTargetSync.Interface {
    canSync(): boolean {
        return true;
    }

    async sync(): ReviewTargetSync.Return {
        return Result.fail(new Error(TARGET_SYNC_FAILURE));
    }
}

const FailingReviewTargetSync = ReviewTargetSync.createImplementation({
    implementation: FailingReviewTargetSyncImpl,
    dependencies: []
});

/** Registered last, so it wins over the app's own adapter: every target write then fails (R16). */
export const failTargetSync = (container: Container) => {
    container.register(FailingReviewTargetSync);
};
