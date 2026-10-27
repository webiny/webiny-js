import { Result } from "@webiny/feature/api";
import type { Container } from "@webiny/di";
import { DeleteTargetReviewsUseCase } from "@webiny/api-workflows/features/review/DeleteTargetReviews/index.js";
import { ReviewPersistenceError } from "@webiny/api-workflows/domain/review/errors.js";

class FailingDeleteTargetReviews implements DeleteTargetReviewsUseCase.Interface {
    public constructor(private decoratee: DeleteTargetReviewsUseCase.Interface) {}

    public async execute(): DeleteTargetReviewsUseCase.Return {
        return Result.fail(new ReviewPersistenceError(new Error("Storage is down.")));
    }
}

class ThrowingDeleteTargetReviews implements DeleteTargetReviewsUseCase.Interface {
    public constructor(private decoratee: DeleteTargetReviewsUseCase.Interface) {}

    public async execute(): DeleteTargetReviewsUseCase.Return {
        throw new Error("Storage is down.");
    }
}

/** The review cleanup returns a failed result (`legacyPlugins`). */
export const failDeleteTargetReviews = (container: Container) => {
    container.registerDecorator(
        DeleteTargetReviewsUseCase.createDecorator({
            decorator: FailingDeleteTargetReviews,
            dependencies: []
        })
    );
};

/** The review cleanup throws (`legacyPlugins`). */
export const throwDeleteTargetReviews = (container: Container) => {
    container.registerDecorator(
        DeleteTargetReviewsUseCase.createDecorator({
            decorator: ThrowingDeleteTargetReviews,
            dependencies: []
        })
    );
};
