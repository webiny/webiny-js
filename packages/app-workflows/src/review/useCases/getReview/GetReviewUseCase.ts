import type { ReviewWithFlags } from "~/review/domain/types.js";
import { ReviewRepository } from "~/review/repository/abstractions.js";
import { GetReviewUseCase as UseCaseAbstraction } from "./abstractions.js";

class GetReviewUseCaseImpl implements UseCaseAbstraction.Interface {
    constructor(private repository: ReviewRepository.Interface) {}

    async execute(params: UseCaseAbstraction.Params): Promise<ReviewWithFlags> {
        return this.repository.getReview(params);
    }
}

export const GetReviewUseCase = UseCaseAbstraction.createImplementation({
    implementation: GetReviewUseCaseImpl,
    dependencies: [ReviewRepository]
});
