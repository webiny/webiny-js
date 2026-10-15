import { Result } from "@webiny/feature/api";
import { TakeOverReviewStepUseCase } from "@webiny/api-workflows/features/review/TakeOverReviewStep/index.js";
import { CmsEntryReviewGuardService } from "../CmsEntryReviewGuardService/index.js";
import { TakeOverCmsEntryReviewStepUseCase as UseCase } from "./abstractions.js";

class TakeOverCmsEntryReviewStepUseCaseImpl implements UseCase.Interface {
    public constructor(
        private guard: CmsEntryReviewGuardService.Interface,
        private engine: TakeOverReviewStepUseCase.Interface
    ) {}

    public async execute(input: UseCase.Input): UseCase.Return {
        const authorized = await this.guard.authorize({
            reviewId: input.reviewId,
            action: "take over this step"
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
            notifyPreviousOwner: input.notifyPreviousOwner ?? true
        });
    }
}

export const TakeOverCmsEntryReviewStepUseCase = UseCase.createImplementation({
    implementation: TakeOverCmsEntryReviewStepUseCaseImpl,
    dependencies: [CmsEntryReviewGuardService, TakeOverReviewStepUseCase]
});
