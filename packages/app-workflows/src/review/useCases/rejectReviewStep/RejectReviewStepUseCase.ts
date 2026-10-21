import type { Review } from "~/review/domain/types.js";
import { ReviewRepository } from "~/review/repository/abstractions.js";
import { RejectReviewStepUseCase as UseCaseAbstraction } from "./abstractions.js";

class RejectReviewStepUseCaseImpl implements UseCaseAbstraction.Interface {
    constructor(private repository: ReviewRepository.Interface) {}

    async execute(params: UseCaseAbstraction.Params): Promise<Review> {
        return this.repository.rejectStep(params);
    }
}

export const RejectReviewStepUseCase = UseCaseAbstraction.createImplementation({
    implementation: RejectReviewStepUseCaseImpl,
    dependencies: [ReviewRepository]
});
