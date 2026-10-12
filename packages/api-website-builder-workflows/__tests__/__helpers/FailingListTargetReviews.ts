import { Result } from "@webiny/feature/api";
import type { Container } from "@webiny/di";
import { ListTargetReviewsUseCase } from "@webiny/api-workflows/features/review/ListTargetReviews/index.js";
import { ReviewPersistenceError } from "@webiny/api-workflows/domain/review/errors.js";

class FailingListTargetReviews implements ListTargetReviewsUseCase.Interface {
    public constructor(private decoratee: ListTargetReviewsUseCase.Interface) {}

    public async execute(): ListTargetReviewsUseCase.Return {
        return Result.fail(new ReviewPersistenceError(new Error("Storage is down.")));
    }
}

/** The target's review list fails (`legacyPlugins`). */
export const failListTargetReviews = (container: Container) => {
    container.registerDecorator(
        ListTargetReviewsUseCase.createDecorator({
            decorator: FailingListTargetReviews,
            dependencies: []
        })
    );
};
