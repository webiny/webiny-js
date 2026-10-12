import { ReviewRepository } from "~/domain/review/abstractions/ReviewRepository.js";
import { ListTargetReviewsUseCase as UseCase } from "./abstractions.js";

class ListTargetReviewsUseCaseImpl implements UseCase.Interface {
    constructor(private repository: ReviewRepository.Interface) {}

    async execute(input: UseCase.Input): UseCase.Return {
        return this.repository.listByTarget({ model: input.model, targetId: input.targetId });
    }
}

export const ListTargetReviewsUseCase = UseCase.createImplementation({
    implementation: ListTargetReviewsUseCaseImpl,
    dependencies: [ReviewRepository]
});
