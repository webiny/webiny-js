import type { BlockingReview } from "~/review/domain/types.js";
import { ReviewRepository } from "~/review/repository/abstractions.js";
import { ListBlockingReviewsUseCase as UseCaseAbstraction } from "./abstractions.js";

class ListBlockingReviewsUseCaseImpl implements UseCaseAbstraction.Interface {
    constructor(private repository: ReviewRepository.Interface) {}

    async execute(params: UseCaseAbstraction.Params): Promise<BlockingReview[]> {
        return this.repository.listBlockingReviews(params);
    }
}

export const ListBlockingReviewsUseCase = UseCaseAbstraction.createImplementation({
    implementation: ListBlockingReviewsUseCaseImpl,
    dependencies: [ReviewRepository]
});
