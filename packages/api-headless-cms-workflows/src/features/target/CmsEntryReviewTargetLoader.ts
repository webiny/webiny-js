import { ReviewTargetLoader } from "@webiny/api-workflows/features/review/ReviewTargetLoader/index.js";
import { isCmsNamespace } from "~/utils/appName.js";
import { CmsEntryTargetReader } from "./CmsEntryTargetReader/index.js";
import { toCmsReviewTarget } from "./toCmsReviewTarget.js";

/**
 * Loads `cms.<modelId>` targets for `RequestReviewUseCase` (spec 9.3). Runs as the requester,
 * whose write access the request wrapper has checked (D77).
 */
class CmsEntryReviewTargetLoaderImpl implements ReviewTargetLoader.Interface {
    public constructor(private targets: CmsEntryTargetReader.Interface) {}

    public canLoad(model: string): boolean {
        return isCmsNamespace(model);
    }

    public async load(
        params: ReviewTargetLoader.LoadParams
    ): Promise<ReviewTargetLoader.Target | null> {
        const target = await this.targets.read({
            model: params.model,
            targetRevisionId: params.targetRevisionId
        });
        if (!target || target.entry.entryId !== params.targetId) {
            return null;
        }
        return toCmsReviewTarget(target);
    }
}

export const CmsEntryReviewTargetLoader = ReviewTargetLoader.createImplementation({
    implementation: CmsEntryReviewTargetLoaderImpl,
    dependencies: [CmsEntryTargetReader]
});
