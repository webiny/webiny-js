import type { Review } from "~/review/domain/types.js";
import { ReviewRepository } from "~/review/repository/abstractions.js";
import { ApproveReviewStepUseCase as UseCaseAbstraction } from "./abstractions.js";

class ApproveReviewStepUseCaseImpl implements UseCaseAbstraction.Interface {
    constructor(private repository: ReviewRepository.Interface) {}

    async execute(params: UseCaseAbstraction.Params): Promise<Review> {
        return this.repository.approveStep(params);
    }
}

export const ApproveReviewStepUseCase = UseCaseAbstraction.createImplementation({
    implementation: ApproveReviewStepUseCaseImpl,
    dependencies: [ReviewRepository]
});
