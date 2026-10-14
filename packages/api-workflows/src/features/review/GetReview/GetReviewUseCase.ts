import { Result } from "@webiny/feature/api";
import { ReviewRepository } from "~/domain/review/abstractions/ReviewRepository.js";
import { StuckStepService } from "~/features/stepRun/StuckStepService/index.js";
import { GetReviewUseCase as UseCase } from "./abstractions.js";

class GetReviewUseCaseImpl implements UseCase.Interface {
    constructor(
        private repository: ReviewRepository.Interface,
        private stuckSteps: StuckStepService.Interface
    ) {}

    async execute(input: UseCase.Input): UseCase.Return {
        const loaded = await this.repository.get(input.id);
        if (loaded.isFail()) {
            return Result.fail(loaded.error);
        }
        // A step whose task ended without a result is failed on the way out (R152).
        return Result.ok(await this.stuckSteps.check(loaded.value));
    }
}

export const GetReviewUseCase = UseCase.createImplementation({
    implementation: GetReviewUseCaseImpl,
    dependencies: [ReviewRepository, StuckStepService]
});
