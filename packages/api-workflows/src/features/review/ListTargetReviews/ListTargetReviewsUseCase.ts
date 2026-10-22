import { ReviewRepository } from "~/domain/review/abstractions/ReviewRepository.js";
import { ListTargetReviewsUseCase as ListTargetReviewsUseCaseAbstraction } from "./abstractions.js";

class ListTargetReviewsUseCaseImpl implements ListTargetReviewsUseCaseAbstraction.Interface {
    constructor(private repository: ReviewRepository.Interface) {}

    async execute(
        input: ListTargetReviewsUseCaseAbstraction.Input
    ): ListTargetReviewsUseCaseAbstraction.Return {
        return this.repository.listByTarget({ model: input.model, targetId: input.targetId });
    }
}

export const ListTargetReviewsUseCase = ListTargetReviewsUseCaseAbstraction.createImplementation({
    implementation: ListTargetReviewsUseCaseImpl,
    dependencies: [ReviewRepository]
});
