import { Result } from "@webiny/feature/api";
import { GetReviewStepRunUseCase } from "@webiny/api-workflows/features/stepRun/GetReviewStepRun/index.js";
import { canViewStepRunByPermission } from "@webiny/api-workflows/domain/review/canViewStepRunByPermission.js";
import { WorkflowsNotAuthorizedError } from "@webiny/api-workflows/domain/permissions/errors.js";
import { WbPageReviewGuardService } from "../WbPageReviewGuardService/index.js";
import { GetWebsiteBuilderPageReviewStepRunUseCase as UseCase } from "./abstractions.js";

const ACTION = "view a step run";

class GetWebsiteBuilderPageReviewStepRunUseCaseImpl implements UseCase.Interface {
    public constructor(
        private guard: WbPageReviewGuardService.Interface,
        private getStepRun: GetReviewStepRunUseCase.Interface
    ) {}

    public async execute(input: UseCase.Input): UseCase.Return {
        const authorized = await this.guard.authorize({
            reviewId: input.reviewId,
            action: ACTION
        });
        if (authorized.isFail()) {
            return Result.fail(authorized.error);
        }

        // Operators only (R258): the requester is not exempt.
        const { viewer } = authorized.value;
        if (!canViewStepRunByPermission(viewer)) {
            return Result.fail(new WorkflowsNotAuthorizedError({ action: ACTION }));
        }

        return this.getStepRun.execute({
            reviewId: input.reviewId,
            stepId: input.stepId,
            taskId: input.taskId
        });
    }
}

export const GetWebsiteBuilderPageReviewStepRunUseCase = UseCase.createImplementation({
    implementation: GetWebsiteBuilderPageReviewStepRunUseCaseImpl,
    dependencies: [WbPageReviewGuardService, GetReviewStepRunUseCase]
});
