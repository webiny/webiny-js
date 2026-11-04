import type { Review } from "~/review/domain/types.js";
import { ReviewRepository } from "~/review/repository/abstractions.js";
import { CancelReviewUseCase as UseCaseAbstraction } from "./abstractions.js";

class CancelReviewUseCaseImpl implements UseCaseAbstraction.Interface {
    constructor(private repository: ReviewRepository.Interface) {}

    async execute(params: UseCaseAbstraction.Params): Promise<Review> {
        return this.repository.cancelReview(params);
    }
}

export const CancelReviewUseCase = UseCaseAbstraction.createImplementation({
    implementation: CancelReviewUseCaseImpl,
    dependencies: [ReviewRepository]
});
