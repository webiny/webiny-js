import type { Review } from "~/review/domain/types.js";
import { ReviewRepository } from "~/review/repository/abstractions.js";
import { RequestReviewUseCase as UseCaseAbstraction } from "./abstractions.js";

class RequestReviewUseCaseImpl implements UseCaseAbstraction.Interface {
    constructor(private repository: ReviewRepository.Interface) {}

    async execute(params: UseCaseAbstraction.Params): Promise<Review> {
        return this.repository.requestReview(params);
    }
}

export const RequestReviewUseCase = UseCaseAbstraction.createImplementation({
    implementation: RequestReviewUseCaseImpl,
    dependencies: [ReviewRepository]
});
