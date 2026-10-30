import type { Review } from "~/review/domain/types.js";
import { ReviewRepository } from "~/review/repository/abstractions.js";
import { ReassignReviewStepUseCase as UseCaseAbstraction } from "./abstractions.js";

class ReassignReviewStepUseCaseImpl implements UseCaseAbstraction.Interface {
    constructor(private repository: ReviewRepository.Interface) {}

    async execute(params: UseCaseAbstraction.Params): Promise<Review> {
        return this.repository.reassignStep(params);
    }
}

export const ReassignReviewStepUseCase = UseCaseAbstraction.createImplementation({
    implementation: ReassignReviewStepUseCaseImpl,
    dependencies: [ReviewRepository]
});
