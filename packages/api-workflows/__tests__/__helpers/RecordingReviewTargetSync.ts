import { ReviewTargetSync } from "~/features/review/ReviewTargetSync/index.js";

/** Every `ReviewTargetSync.sync` call while the decorator is registered. Reset per test. */
export const recordedSyncs: ReviewTargetSync.Params[] = [];

class RecordingReviewTargetSyncImpl implements ReviewTargetSync.Interface {
    constructor(private decoratee: ReviewTargetSync.Interface) {}

    async sync(params: ReviewTargetSync.Params): ReviewTargetSync.Return {
        recordedSyncs.push(structuredClone(params));
        return this.decoratee.sync(params);
    }
}

export const RecordingReviewTargetSync = ReviewTargetSync.createDecorator({
    decorator: RecordingReviewTargetSyncImpl,
    dependencies: []
});
