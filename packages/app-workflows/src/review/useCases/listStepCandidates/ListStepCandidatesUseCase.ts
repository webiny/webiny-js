import type { StepCandidate } from "~/review/domain/types.js";
import { ReviewRepository } from "~/review/repository/abstractions.js";
import { ListStepCandidatesUseCase as UseCaseAbstraction } from "./abstractions.js";

class ListStepCandidatesUseCaseImpl implements UseCaseAbstraction.Interface {
    constructor(private repository: ReviewRepository.Interface) {}

    async execute(params: UseCaseAbstraction.Params): Promise<StepCandidate[]> {
        return this.repository.listStepCandidates(params);
    }
}

export const ListStepCandidatesUseCase = UseCaseAbstraction.createImplementation({
    implementation: ListStepCandidatesUseCaseImpl,
    dependencies: [ReviewRepository]
});
