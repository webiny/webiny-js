import { Result } from "@webiny/feature/api";
import type { Container } from "@webiny/di";
import { GetTargetReviewUseCase } from "@webiny/api-workflows/features/review/GetTargetReview/index.js";
import { ReviewPersistenceError } from "@webiny/api-workflows/domain/review/errors.js";

class FailingGetTargetReview implements GetTargetReviewUseCase.Interface {
    public constructor(private decoratee: GetTargetReviewUseCase.Interface) {}

    public async execute(): GetTargetReviewUseCase.Return {
        return Result.fail(new ReviewPersistenceError(new Error("Storage is down.")));
    }
}

/** The revision's review lookup fails (`legacyPlugins`). */
export const failGetTargetReview = (container: Container) => {
    container.registerDecorator(
        GetTargetReviewUseCase.createDecorator({
            decorator: FailingGetTargetReview,
            dependencies: []
        })
    );
};
