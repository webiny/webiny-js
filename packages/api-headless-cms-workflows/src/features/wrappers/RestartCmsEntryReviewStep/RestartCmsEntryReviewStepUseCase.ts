import { Result } from "@webiny/feature/api";
import { RestartReviewStepUseCase } from "@webiny/api-workflows/features/review/RestartReviewStep/index.js";
import { canRestartByPermission } from "@webiny/api-workflows/domain/review/canRestartByPermission.js";
import { WorkflowsNotAuthorizedError } from "@webiny/api-workflows/domain/permissions/errors.js";
import { CmsEntryReviewGuardService } from "../CmsEntryReviewGuardService/index.js";
import { RestartCmsEntryReviewStepUseCase as UseCase } from "./abstractions.js";

const ACTION = "restart a review step";

class RestartCmsEntryReviewStepUseCaseImpl implements UseCase.Interface {
    public constructor(
        private guard: CmsEntryReviewGuardService.Interface,
        private restartStep: RestartReviewStepUseCase.Interface
    ) {}

    public async execute(input: UseCase.Input): UseCase.Return {
        const authorized = await this.guard.authorize({
            reviewId: input.reviewId,
            action: ACTION
        });
        if (authorized.isFail()) {
            return Result.fail(authorized.error);
        }

        const { review, viewer } = authorized.value;
        // Permission only: whether the step can be restarted is the engine's (1b R41).
        if (!canRestartByPermission(review, viewer)) {
            return Result.fail(new WorkflowsNotAuthorizedError({ action: ACTION }));
        }

        return this.restartStep.execute({
            reviewId: input.reviewId,
            stepId: input.stepId,
            actor: viewer.actor
        });
    }
}

export const RestartCmsEntryReviewStepUseCase = UseCase.createImplementation({
    implementation: RestartCmsEntryReviewStepUseCaseImpl,
    dependencies: [CmsEntryReviewGuardService, RestartReviewStepUseCase]
});
