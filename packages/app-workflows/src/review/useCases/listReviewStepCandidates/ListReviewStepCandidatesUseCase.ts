import type { StepCandidate } from "~/review/domain/types.js";
import { ReviewRepository } from "~/review/repository/abstractions.js";
import { ListReviewStepCandidatesUseCase as UseCaseAbstraction } from "./abstractions.js";

class ListReviewStepCandidatesUseCaseImpl implements UseCaseAbstraction.Interface {
    constructor(private repository: ReviewRepository.Interface) {}

    async execute(params: UseCaseAbstraction.Params): Promise<StepCandidate[]> {
        return this.repository.listReviewStepCandidates(params);
    }
}

export const ListReviewStepCandidatesUseCase = UseCaseAbstraction.createImplementation({
    implementation: ListReviewStepCandidatesUseCaseImpl,
    dependencies: [ReviewRepository]
});
