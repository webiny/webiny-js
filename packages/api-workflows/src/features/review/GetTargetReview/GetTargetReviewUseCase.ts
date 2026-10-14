import { Result } from "@webiny/feature/api";
import { ReviewRepository } from "~/domain/review/abstractions/ReviewRepository.js";
import { StuckStepService } from "~/features/stepRun/StuckStepService/index.js";
import { GetTargetReviewUseCase as UseCase } from "./abstractions.js";

class GetTargetReviewUseCaseImpl implements UseCase.Interface {
    constructor(
        private repository: ReviewRepository.Interface,
        private stuckSteps: StuckStepService.Interface
    ) {}

    async execute(input: UseCase.Input): UseCase.Return {
        const loaded = await this.repository.getActiveByTarget({
            model: input.model,
            targetRevisionId: input.targetRevisionId
        });
        if (loaded.isFail()) {
            return Result.fail(loaded.error);
        }
        if (!loaded.value) {
            return Result.ok(null);
        }
        // A step whose task ended without a result is failed on the way out (R152).
        return Result.ok(await this.stuckSteps.check(loaded.value));
    }
}

export const GetTargetReviewUseCase = UseCase.createImplementation({
    implementation: GetTargetReviewUseCaseImpl,
    dependencies: [ReviewRepository, StuckStepService]
});
