import { Result } from "@webiny/feature/api";
import { RejectReviewStepUseCase } from "@webiny/api-workflows/features/review/RejectReviewStep/index.js";
import { WbPageReviewGuardService } from "../WbPageReviewGuardService/index.js";
import { RejectWebsiteBuilderPageReviewStepUseCase as UseCase } from "./abstractions.js";

class RejectWebsiteBuilderPageReviewStepUseCaseImpl implements UseCase.Interface {
    public constructor(
        private guard: WbPageReviewGuardService.Interface,
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

export const RejectWebsiteBuilderPageReviewStepUseCase = UseCase.createImplementation({
    implementation: RejectWebsiteBuilderPageReviewStepUseCaseImpl,
    dependencies: [WbPageReviewGuardService, RejectReviewStepUseCase]
});
