import { Result } from "@webiny/feature/api";
import { ReviewTargetSync } from "~/features/review/ReviewTargetSync/index.js";
import { callLog } from "./callLog.js";
import { ARTICLE_MODEL } from "./fixtures.js";

/** Every `ReviewTargetSync.sync` call while the implementation is registered. Reset per test. */
export const recordedSyncs: ReviewTargetSync.Params[] = [];

/** Syncs "cms.article" reviews only and records the call. */
class RecordingReviewTargetSyncImpl implements ReviewTargetSync.Interface {
    canSync(model: string): boolean {
        return model === ARTICLE_MODEL;
    }

    async sync(params: ReviewTargetSync.Params): ReviewTargetSync.Return {
        recordedSyncs.push(structuredClone(params));
        callLog.push("sync");
        return Result.ok();
    }
}

export const RecordingReviewTargetSync = ReviewTargetSync.createImplementation({
    implementation: RecordingReviewTargetSyncImpl,
    dependencies: []
});
