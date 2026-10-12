import { Result } from "@webiny/feature/api";
import { ApproveReviewStepUseCase } from "@webiny/api-workflows/features/review/ApproveReviewStep/index.js";
import { WbPageReviewGuardService } from "../WbPageReviewGuardService/index.js";
import { ApproveWebsiteBuilderPageReviewStepUseCase as UseCase } from "./abstractions.js";

class ApproveWebsiteBuilderPageReviewStepUseCaseImpl implements UseCase.Interface {
    public constructor(
        private guard: WbPageReviewGuardService.Interface,
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

export const ApproveWebsiteBuilderPageReviewStepUseCase = UseCase.createImplementation({
    implementation: ApproveWebsiteBuilderPageReviewStepUseCaseImpl,
    dependencies: [WbPageReviewGuardService, ApproveReviewStepUseCase]
});
