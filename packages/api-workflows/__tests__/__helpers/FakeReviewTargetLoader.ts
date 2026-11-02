import { ReviewTargetLoader } from "~/features/review/ReviewTargetLoader/index.js";
import { ARTICLE_MODEL, targetContext } from "./fixtures.js";

/** A target id the fake loader reports as missing. */
export const MISSING_TARGET_ID = "article-missing";

/** Loads "cms.article" targets only; title is "Article <targetId>". */
class FakeReviewTargetLoaderImpl implements ReviewTargetLoader.Interface {
    canLoad(model: string): boolean {
        return model === ARTICLE_MODEL;
    }

    async load(params: ReviewTargetLoader.LoadParams): Promise<ReviewTargetLoader.Target | null> {
        if (params.targetId === MISSING_TARGET_ID) {
            return null;
        }
        const title = `Article ${params.targetId}`;
        return {
            title,
            context: { ...targetContext, title }
        };
    }
}

export const FakeReviewTargetLoader = ReviewTargetLoader.createImplementation({
    implementation: FakeReviewTargetLoaderImpl,
    dependencies: []
});
