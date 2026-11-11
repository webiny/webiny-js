import { Result } from "@webiny/feature/api";
import type { Container } from "@webiny/di";
import { GetActiveTargetReviewUseCase } from "@webiny/api-workflows/features/review/GetActiveTargetReview/index.js";
import { ReviewPersistenceError } from "@webiny/api-workflows/domain/review/errors.js";

class FailingGetActiveTargetReview implements GetActiveTargetReviewUseCase.Interface {
    public constructor(private decoratee: GetActiveTargetReviewUseCase.Interface) {}

    public async execute(): GetActiveTargetReviewUseCase.Return {
        return Result.fail(new ReviewPersistenceError(new Error("Storage is down.")));
    }
}

/** The save block's and publish rule's review lookup fails (`legacyPlugins`). */
export const failGetActiveTargetReview = (container: Container) => {
    container.registerDecorator(
        GetActiveTargetReviewUseCase.createDecorator({
            decorator: FailingGetActiveTargetReview,
            dependencies: []
        })
    );
};
