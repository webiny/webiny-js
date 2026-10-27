import { Result } from "@webiny/feature/api";
import { ListReviewAssignmentsUseCase } from "@webiny/api-workflows/features/assignment/ListReviewAssignments/index.js";
import { getReviewViewerFlags } from "@webiny/api-workflows/domain/review/getReviewViewerFlags.js";
import { redactAssignmentRecords } from "@webiny/api-workflows/domain/assignment/redactAssignmentRecords.js";
import { attachAssignmentRecords } from "@webiny/api-workflows/domain/assignment/attachAssignmentRecords.js";
import { CmsEntryReviewGuardService } from "../CmsEntryReviewGuardService/index.js";
import { GetCmsEntryReviewUseCase as UseCase } from "./abstractions.js";

class GetCmsEntryReviewUseCaseImpl implements UseCase.Interface {
    public constructor(
        private guard: CmsEntryReviewGuardService.Interface,
        private listAssignments: ListReviewAssignmentsUseCase.Interface
    ) {}

    public async execute(input: UseCase.Input): UseCase.Return {
        const authorized = await this.guard.authorize({
            reviewId: input.id,
            action: "view this review"
        });
        if (authorized.isFail()) {
            return Result.fail(authorized.error);
        }
        const { review, viewer } = authorized.value;

        const records = await this.listAssignments.execute({ reviewId: review.id });
        if (records.isFail()) {
            return Result.fail(records.error);
        }
        const visible = redactAssignmentRecords(records.value, viewer.permissions);

        // The guard has proven read access to the target, so the viewer flags apply as they are.
        return Result.ok({
            review: attachAssignmentRecords(review, visible),
            flags: getReviewViewerFlags(review, viewer)
        });
    }
}

export const GetCmsEntryReviewUseCase = UseCase.createImplementation({
    implementation: GetCmsEntryReviewUseCaseImpl,
    dependencies: [CmsEntryReviewGuardService, ListReviewAssignmentsUseCase]
});
