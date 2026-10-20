import type { Review } from "~/review/domain/types.js";
import { ReviewRepository } from "~/review/repository/abstractions.js";
import { TakeOverReviewStepUseCase as UseCaseAbstraction } from "./abstractions.js";

class TakeOverReviewStepUseCaseImpl implements UseCaseAbstraction.Interface {
    constructor(private repository: ReviewRepository.Interface) {}

    async execute(params: UseCaseAbstraction.Params): Promise<Review> {
        return this.repository.takeOverStep(params);
    }
}

export const TakeOverReviewStepUseCase = UseCaseAbstraction.createImplementation({
    implementation: TakeOverReviewStepUseCaseImpl,
    dependencies: [ReviewRepository]
});
