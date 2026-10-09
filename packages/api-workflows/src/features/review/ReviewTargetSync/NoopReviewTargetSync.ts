import { Result } from "@webiny/feature/api";
import { ReviewTargetSync } from "./abstractions.js";

/** Default until phase 2 registers the target adapters' sync. */
class NoopReviewTargetSyncImpl implements ReviewTargetSync.Interface {
    async sync(): ReviewTargetSync.Return {
        return Result.ok();
    }
}

export const NoopReviewTargetSync = ReviewTargetSync.createImplementation({
    implementation: NoopReviewTargetSyncImpl,
    dependencies: []
});
