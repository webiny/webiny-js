import { Result } from "@webiny/feature/api";
import { RejectReviewStepUseCase } from "@webiny/api-workflows/features/review/RejectReviewStep/index.js";
import { CmsEntryReviewGuardService } from "../CmsEntryReviewGuardService/index.js";
import { RejectCmsEntryReviewStepUseCase as UseCase } from "./abstractions.js";

class RejectCmsEntryReviewStepUseCaseImpl implements UseCase.Interface {
    public constructor(
        private guard: CmsEntryReviewGuardService.Interface,
        private engine: RejectReviewStepUseCase.Interface
    ) {}

    public async execute(input: UseCase.Input): UseCase.Return {
        const authorized = await this.guard.authorize({
            reviewId: input.reviewId,
            action: "reject this step"
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

export const RejectCmsEntryReviewStepUseCase = UseCase.createImplementation({
    implementation: RejectCmsEntryReviewStepUseCaseImpl,
    dependencies: [CmsEntryReviewGuardService, RejectReviewStepUseCase]
});
