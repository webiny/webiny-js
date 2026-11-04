import { Result } from "@webiny/feature/api";
import { getReviewViewerFlags } from "@webiny/api-workflows/domain/review/getReviewViewerFlags.js";
import { redactAssignmentRecords } from "@webiny/api-workflows/domain/assignment/redactAssignmentRecords.js";
import { attachAssignmentRecords } from "@webiny/api-workflows/domain/assignment/attachAssignmentRecords.js";
import { ListReviewAssignmentsUseCase } from "@webiny/api-workflows/features/assignment/ListReviewAssignments/index.js";
import { WbPageReviewGuardService } from "../WbPageReviewGuardService/index.js";
import { GetWebsiteBuilderPageReviewUseCase as UseCase } from "./abstractions.js";

class GetWebsiteBuilderPageReviewUseCaseImpl implements UseCase.Interface {
    public constructor(
        private guard: WbPageReviewGuardService.Interface,
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

        const assignments = await this.listAssignments.execute({ reviewId: review.id });
        if (assignments.isFail()) {
            return Result.fail(assignments.error);
        }

        // The guard has proven read access to the target, so the viewer flags apply as they are.
        const visible = redactAssignmentRecords(assignments.value, viewer.permissions);
        return Result.ok({
            review: attachAssignmentRecords(review, visible),
            flags: getReviewViewerFlags(review, viewer)
        });
    }
}

export const GetWebsiteBuilderPageReviewUseCase = UseCase.createImplementation({
    implementation: GetWebsiteBuilderPageReviewUseCaseImpl,
    dependencies: [WbPageReviewGuardService, ListReviewAssignmentsUseCase]
});
