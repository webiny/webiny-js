import type { ReviewWithFlags } from "~/review/domain/types.js";
import { ReviewRepository } from "~/review/repository/abstractions.js";
import { GetTargetReviewUseCase as UseCaseAbstraction } from "./abstractions.js";

class GetTargetReviewUseCaseImpl implements UseCaseAbstraction.Interface {
    constructor(private repository: ReviewRepository.Interface) {}

    async execute(params: UseCaseAbstraction.Params): Promise<ReviewWithFlags | null> {
        return this.repository.getTargetReview(params);
    }
}

export const GetTargetReviewUseCase = UseCaseAbstraction.createImplementation({
    implementation: GetTargetReviewUseCaseImpl,
    dependencies: [ReviewRepository]
});
