import { ReviewTargetLoader } from "@webiny/api-workflows/features/review/ReviewTargetLoader/index.js";
import { WB_PAGE_NAMESPACE } from "~/constants.js";
import { WbPageTargetReader } from "./WbPageTargetReader/index.js";
import { toWbPageReviewTarget } from "./toWbPageReviewTarget.js";

/** Loads `wb.page` targets for `RequestReviewUseCase` (spec 9.3). */
class WbPageReviewTargetLoaderImpl implements ReviewTargetLoader.Interface {
    public constructor(private targets: WbPageTargetReader.Interface) {}

    public canLoad(model: string): boolean {
        return model === WB_PAGE_NAMESPACE;
    }

    public async load(
        params: ReviewTargetLoader.LoadParams
    ): Promise<ReviewTargetLoader.Target | null> {
        const target = await this.targets.read({
            model: params.model,
            targetRevisionId: params.targetRevisionId
        });
        if (!target || target.page.entryId !== params.targetId) {
            return null;
        }
        return toWbPageReviewTarget(target);
    }
}

export const WbPageReviewTargetLoader = ReviewTargetLoader.createImplementation({
    implementation: WbPageReviewTargetLoaderImpl,
    dependencies: [WbPageTargetReader]
});
