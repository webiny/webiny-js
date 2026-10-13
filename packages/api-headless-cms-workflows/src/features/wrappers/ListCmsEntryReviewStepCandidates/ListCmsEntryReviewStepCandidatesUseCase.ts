import { Result } from "@webiny/feature/api";
import { ListStepCandidatesUseCase } from "@webiny/api-workflows/features/routing/ListStepCandidates/index.js";
import { canReassignByPermission } from "@webiny/api-workflows/domain/review/canReassignByPermission.js";
import { redactStepCandidates } from "@webiny/api-workflows/domain/routing/redactStepCandidates.js";
import { WorkflowsNotAuthorizedError } from "@webiny/api-workflows/domain/permissions/errors.js";
import { CmsEntryReviewGuardService } from "../CmsEntryReviewGuardService/index.js";
import { ListCmsEntryReviewStepCandidatesUseCase as UseCase } from "./abstractions.js";

const ACTION = "list the step's candidates";

class ListCmsEntryReviewStepCandidatesUseCaseImpl implements UseCase.Interface {
    public constructor(
        private guard: CmsEntryReviewGuardService.Interface,
        private listCandidates: ListStepCandidatesUseCase.Interface
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
        if (!canReassignByPermission(viewer)) {
            return Result.fail(new WorkflowsNotAuthorizedError({ action: ACTION }));
        }

        const candidates = await this.listCandidates.execute({
            reviewId: input.reviewId,
            stepId: input.stepId
        });
        if (candidates.isFail()) {
            return Result.fail(candidates.error);
        }
        // This path requires `reassign`, so the call never clears a reason; kept so both candidate
        // lists share one redaction rule (R120).
        return Result.ok(redactStepCandidates(candidates.value, viewer.permissions));
    }
}

export const ListCmsEntryReviewStepCandidatesUseCase = UseCase.createImplementation({
    implementation: ListCmsEntryReviewStepCandidatesUseCaseImpl,
    dependencies: [CmsEntryReviewGuardService, ListStepCandidatesUseCase]
});
