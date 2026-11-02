import type { Review } from "~/review/domain/types.js";
import { ReviewRepository } from "~/review/repository/abstractions.js";
import { CancelReviewsForDeleteUseCase as UseCaseAbstraction } from "./abstractions.js";

class CancelReviewsForDeleteUseCaseImpl implements UseCaseAbstraction.Interface {
    constructor(private repository: ReviewRepository.Interface) {}

    async execute(params: UseCaseAbstraction.Params): Promise<Review[]> {
        return this.repository.cancelForDelete(params);
    }
}

export const CancelReviewsForDeleteUseCase = UseCaseAbstraction.createImplementation({
    implementation: CancelReviewsForDeleteUseCaseImpl,
    dependencies: [ReviewRepository]
});
