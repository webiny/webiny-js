import type { Container } from "@webiny/di";
import { DeleteTargetReviewsUseCase } from "@webiny/api-workflows/features/review/DeleteTargetReviews/index.js";

class ThrowingDeleteTargetReviews implements DeleteTargetReviewsUseCase.Interface {
    public constructor(private decoratee: DeleteTargetReviewsUseCase.Interface) {}

    public async execute(): DeleteTargetReviewsUseCase.Return {
        throw new Error("Storage is down.");
    }
}

/** The review cleanup throws (`legacyPlugins`). */
export const throwDeleteTargetReviews = (container: Container) => {
    container.registerDecorator(
        DeleteTargetReviewsUseCase.createDecorator({
            decorator: ThrowingDeleteTargetReviews,
            dependencies: []
        })
    );
};
