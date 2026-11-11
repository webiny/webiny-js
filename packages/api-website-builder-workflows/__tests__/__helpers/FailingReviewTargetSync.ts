import type { Container } from "@webiny/di";
import { Result } from "@webiny/feature/api";
import { ReviewTargetSync } from "@webiny/api-workflows/features/review/ReviewTargetSync/index.js";

class FailingReviewTargetSyncImpl implements ReviewTargetSync.Interface {
    canSync(): boolean {
        return true;
    }

    async sync(): ReviewTargetSync.Return {
        return Result.fail(new Error("The target revision is locked."));
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
