import { ReviewRepository } from "~/domain/review/abstractions/ReviewRepository.js";
import { GetTargetReviewUseCase as UseCase } from "./abstractions.js";

class GetTargetReviewUseCaseImpl implements UseCase.Interface {
    constructor(private repository: ReviewRepository.Interface) {}

    async execute(input: UseCase.Input): UseCase.Return {
        return this.repository.getActiveByTarget({
            model: input.model,
            targetRevisionId: input.targetRevisionId
        });
    }
}

export const GetTargetReviewUseCase = UseCase.createImplementation({
    implementation: GetTargetReviewUseCaseImpl,
    dependencies: [ReviewRepository]
});
