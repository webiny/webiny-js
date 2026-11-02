import { ReviewRepository } from "~/domain/review/abstractions/ReviewRepository.js";
import { GetActiveTargetReviewUseCase as GetActiveTargetReviewUseCaseAbstraction } from "./abstractions.js";

class GetActiveTargetReviewUseCaseImpl
    implements GetActiveTargetReviewUseCaseAbstraction.Interface
{
    constructor(private repository: ReviewRepository.Interface) {}

    execute(
        input: GetActiveTargetReviewUseCaseAbstraction.Input
    ): GetActiveTargetReviewUseCaseAbstraction.Return {
        return this.repository.getActiveByTarget({
            model: input.model,
            targetRevisionId: input.targetRevisionId
        });
    }
}

export const GetActiveTargetReviewUseCase =
    GetActiveTargetReviewUseCaseAbstraction.createImplementation({
        implementation: GetActiveTargetReviewUseCaseImpl,
        dependencies: [ReviewRepository]
    });
