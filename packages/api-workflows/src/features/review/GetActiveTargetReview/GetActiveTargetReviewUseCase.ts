import { ReviewRepository } from "~/domain/review/abstractions/ReviewRepository.js";
import { GetActiveTargetReviewUseCase as UseCase } from "./abstractions.js";

class GetActiveTargetReviewUseCaseImpl implements UseCase.Interface {
    constructor(private repository: ReviewRepository.Interface) {}

    execute(input: UseCase.Input): UseCase.Return {
        return this.repository.getActiveByTarget({
            model: input.model,
            targetRevisionId: input.targetRevisionId
        });
    }
}

export const GetActiveTargetReviewUseCase = UseCase.createImplementation({
    implementation: GetActiveTargetReviewUseCaseImpl,
    dependencies: [ReviewRepository]
});
