import { Result } from "@webiny/feature/api";
import { ReassignReviewStepUseCase } from "@webiny/api-workflows/features/review/ReassignReviewStep/index.js";
import { canReassignByPermission } from "@webiny/api-workflows/domain/review/canReassignByPermission.js";
import { WorkflowsNotAuthorizedError } from "@webiny/api-workflows/domain/permissions/errors.js";
import { WbPageReviewGuardService } from "../WbPageReviewGuardService/index.js";
import { ReassignWebsiteBuilderPageReviewStepUseCase as UseCase } from "./abstractions.js";

const ACTION = "reassign this step";

class ReassignWebsiteBuilderPageReviewStepUseCaseImpl implements UseCase.Interface {
    public constructor(
        private guard: WbPageReviewGuardService.Interface,
        private reassignStep: ReassignReviewStepUseCase.Interface
    ) {}

    public async execute(input: UseCase.Input): UseCase.Return {
        const authorized = await this.guard.authorize({
            reviewId: input.reviewId,
            action: ACTION
        });
        if (authorized.isFail()) {
            return Result.fail(authorized.error);
        }

        const { viewer } = authorized.value;
        // Permission only: whether the step can be reassigned is the engine's (1b R41).
        if (!canReassignByPermission(viewer)) {
            return Result.fail(new WorkflowsNotAuthorizedError({ action: ACTION }));
        }

        return this.reassignStep.execute({
            reviewId: input.reviewId,
            stepId: input.stepId,
            userId: input.userId,
            actor: viewer.actor
        });
    }
}

export const ReassignWebsiteBuilderPageReviewStepUseCase = UseCase.createImplementation({
    implementation: ReassignWebsiteBuilderPageReviewStepUseCaseImpl,
    dependencies: [WbPageReviewGuardService, ReassignReviewStepUseCase]
});
