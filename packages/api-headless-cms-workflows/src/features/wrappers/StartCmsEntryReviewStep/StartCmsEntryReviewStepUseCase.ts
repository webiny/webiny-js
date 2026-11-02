import { Result } from "@webiny/feature/api";
import { StartReviewStepUseCase } from "@webiny/api-workflows/features/review/StartReviewStep/index.js";
import { CmsEntryReviewGuardService } from "../CmsEntryReviewGuardService/index.js";
import { StartCmsEntryReviewStepUseCase as UseCase } from "./abstractions.js";

class StartCmsEntryReviewStepUseCaseImpl implements UseCase.Interface {
    public constructor(
        private guard: CmsEntryReviewGuardService.Interface,
        private engine: StartReviewStepUseCase.Interface
    ) {}

    public async execute(input: UseCase.Input): UseCase.Return {
        const authorized = await this.guard.authorize({
            reviewId: input.reviewId,
            action: "start this step"
        });
        if (authorized.isFail()) {
            return Result.fail(authorized.error);
        }

        const { viewer } = authorized.value;
        return this.engine.execute({
            reviewId: input.reviewId,
            stepId: input.stepId,
            actor: viewer.actor,
            actorTeamIds: viewer.teamIds
        });
    }
}

export const StartCmsEntryReviewStepUseCase = UseCase.createImplementation({
    implementation: StartCmsEntryReviewStepUseCaseImpl,
    dependencies: [CmsEntryReviewGuardService, StartReviewStepUseCase]
});
