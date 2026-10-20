import type { Review } from "~/review/domain/types.js";
import { ReviewRepository } from "~/review/repository/abstractions.js";
import { StartReviewStepUseCase as UseCaseAbstraction } from "./abstractions.js";

class StartReviewStepUseCaseImpl implements UseCaseAbstraction.Interface {
    constructor(private repository: ReviewRepository.Interface) {}

    async execute(params: UseCaseAbstraction.Params): Promise<Review> {
        return this.repository.startStep(params);
    }
}

export const StartReviewStepUseCase = UseCaseAbstraction.createImplementation({
    implementation: StartReviewStepUseCaseImpl,
    dependencies: [ReviewRepository]
});
