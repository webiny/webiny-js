import { ReviewRepository } from "~/domain/review/abstractions/ReviewRepository.js";
import { ListReviewsByTargetsUseCase as UseCase } from "./abstractions.js";

class ListReviewsByTargetsUseCaseImpl implements UseCase.Interface {
    constructor(private repository: ReviewRepository.Interface) {}

    async execute(input: UseCase.Input): UseCase.Return {
        return this.repository.listByTargets({ model: input.model, targetIds: input.targetIds });
    }
}

export const ListReviewsByTargetsUseCase = UseCase.createImplementation({
    implementation: ListReviewsByTargetsUseCaseImpl,
    dependencies: [ReviewRepository]
});
