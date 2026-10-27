import { ReviewRepository } from "~/domain/review/abstractions/ReviewRepository.js";
import { ListReviewsByTargetsUseCase as ListReviewsByTargetsUseCaseAbstraction } from "./abstractions.js";

class ListReviewsByTargetsUseCaseImpl implements ListReviewsByTargetsUseCaseAbstraction.Interface {
    constructor(private repository: ReviewRepository.Interface) {}

    async execute(
        input: ListReviewsByTargetsUseCaseAbstraction.Input
    ): ListReviewsByTargetsUseCaseAbstraction.Return {
        return this.repository.listByTargets({
            model: input.model,
            targetIds: input.targetIds,
            state: input.state
        });
    }
}

export const ListReviewsByTargetsUseCase =
    ListReviewsByTargetsUseCaseAbstraction.createImplementation({
        implementation: ListReviewsByTargetsUseCaseImpl,
        dependencies: [ReviewRepository]
    });
