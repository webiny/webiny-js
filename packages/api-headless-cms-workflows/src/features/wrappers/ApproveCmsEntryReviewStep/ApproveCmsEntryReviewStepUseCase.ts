import { Result } from "@webiny/feature/api";
import { ApproveReviewStepUseCase } from "@webiny/api-workflows/features/review/ApproveReviewStep/index.js";
import { CmsEntryReviewGuardService } from "../CmsEntryReviewGuardService/index.js";
import { ApproveCmsEntryReviewStepUseCase as UseCase } from "./abstractions.js";

class ApproveCmsEntryReviewStepUseCaseImpl implements UseCase.Interface {
    public constructor(
        private guard: CmsEntryReviewGuardService.Interface,
        private engine: ApproveReviewStepUseCase.Interface
    ) {}

    public async execute(input: UseCase.Input): UseCase.Return {
        const authorized = await this.guard.authorize({
            reviewId: input.reviewId,
            action: "approve this step"
        });
        if (authorized.isFail()) {
            return Result.fail(authorized.error);
        }

        const { viewer } = authorized.value;
        return this.engine.execute({
            reviewId: input.reviewId,
            stepId: input.stepId,
            actor: viewer.actor,
            actorTeamIds: viewer.teamIds,
            comment: input.comment ?? null
        });
    }
}

export const ApproveCmsEntryReviewStepUseCase = UseCase.createImplementation({
    implementation: ApproveCmsEntryReviewStepUseCaseImpl,
    dependencies: [CmsEntryReviewGuardService, ApproveReviewStepUseCase]
});
