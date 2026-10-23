import { Result } from "@webiny/feature/api";
import { ReviewTargetSync } from "~/features/review/ReviewTargetSync/index.js";
import { recordedSyncs } from "./RecordingReviewTargetSync.js";
import { ARTICLE_MODEL } from "./fixtures.js";

export const TARGET_SYNC_FAILURE = "The target revision is locked.";

/** A target adapter whose write fails (R16), e.g. the target revision was deleted meanwhile. */
class FailingReviewTargetSyncImpl implements ReviewTargetSync.Interface {
    canSync(model: string): boolean {
        return model === ARTICLE_MODEL;
    }

    async sync(params: ReviewTargetSync.Params): ReviewTargetSync.Return {
        recordedSyncs.push(structuredClone(params));
        return Result.fail(new Error(TARGET_SYNC_FAILURE));
    }
}

export const FailingReviewTargetSync = ReviewTargetSync.createImplementation({
    implementation: FailingReviewTargetSyncImpl,
    dependencies: []
});
