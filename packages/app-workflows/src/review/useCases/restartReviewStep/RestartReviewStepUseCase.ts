import type { Review } from "~/review/domain/types.js";
import { ReviewRepository } from "~/review/repository/abstractions.js";
import { RestartReviewStepUseCase as UseCaseAbstraction } from "./abstractions.js";

class RestartReviewStepUseCaseImpl implements UseCaseAbstraction.Interface {
    constructor(private repository: ReviewRepository.Interface) {}

    async execute(params: UseCaseAbstraction.Params): Promise<Review> {
        return this.repository.restartStep(params);
    }
}

export const RestartReviewStepUseCase = UseCaseAbstraction.createImplementation({
    implementation: RestartReviewStepUseCaseImpl,
    dependencies: [ReviewRepository]
});
