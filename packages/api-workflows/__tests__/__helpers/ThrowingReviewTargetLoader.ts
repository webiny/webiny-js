import { ReviewTargetLoader } from "~/features/review/ReviewTargetLoader/index.js";
import { ARTICLE_MODEL } from "./fixtures.js";

export const TARGET_LOAD_THROW = "The target store is down.";

/** A loader for "cms.article" that throws. */
class ThrowingReviewTargetLoaderImpl implements ReviewTargetLoader.Interface {
    canLoad(model: string): boolean {
        return model === ARTICLE_MODEL;
    }

    async load(): Promise<ReviewTargetLoader.Target | null> {
        throw new Error(TARGET_LOAD_THROW);
    }
}

export const ThrowingReviewTargetLoader = ReviewTargetLoader.createImplementation({
    implementation: ThrowingReviewTargetLoaderImpl,
    dependencies: []
});
