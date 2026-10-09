import { ReviewRepository } from "~/domain/review/abstractions/ReviewRepository.js";
import { GetReviewUseCase as UseCase } from "./abstractions.js";

class GetReviewUseCaseImpl implements UseCase.Interface {
    constructor(private repository: ReviewRepository.Interface) {}

    async execute(input: UseCase.Input): UseCase.Return {
        return this.repository.get(input.id);
    }
}

export const GetReviewUseCase = UseCase.createImplementation({
    implementation: GetReviewUseCaseImpl,
    dependencies: [ReviewRepository]
});
