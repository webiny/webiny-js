import { Result } from "@webiny/feature/api";
import { getReviewViewerFlags } from "@webiny/api-workflows/domain/review/getReviewViewerFlags.js";
import { redactAssignmentRecords } from "@webiny/api-workflows/domain/assignment/redactAssignmentRecords.js";
import { attachAssignmentRecords } from "@webiny/api-workflows/domain/assignment/attachAssignmentRecords.js";
import { WorkflowsNotAuthorizedError } from "@webiny/api-workflows/domain/permissions/errors.js";
import { ReviewPersistenceError } from "@webiny/api-workflows/domain/review/errors.js";
import { CurrentReviewViewer } from "@webiny/api-workflows/features/identity/CurrentReviewViewer/index.js";
import { GetTargetReviewUseCase } from "@webiny/api-workflows/features/review/GetTargetReview/index.js";
import { ListReviewAssignmentsUseCase } from "@webiny/api-workflows/features/assignment/ListReviewAssignments/index.js";
import { WbPageTargetReader } from "~/features/target/WbPageTargetReader/index.js";
import { WbPageAccess } from "~/features/target/WbPageAccess/index.js";
import { WB_PAGE_NAMESPACE } from "~/constants.js";
import { GetWebsiteBuilderPageTargetReviewUseCase as UseCase } from "./abstractions.js";

class GetWebsiteBuilderPageTargetReviewUseCaseImpl implements UseCase.Interface {
    public constructor(
        private viewer: CurrentReviewViewer.Interface,
        private targets: WbPageTargetReader.Interface,
        private access: WbPageAccess.Interface,
        private getTargetReview: GetTargetReviewUseCase.Interface,
        private listAssignments: ListReviewAssignmentsUseCase.Interface
    ) {}

    public async execute(input: UseCase.Input): UseCase.Return {
        // A failed team or permission load is a persistence error, never a rejection (R87).
        let viewer: Awaited<CurrentReviewViewer.Return>;
        try {
            viewer = await this.viewer.get();
        } catch (error) {
            return Result.fail(
                new ReviewPersistenceError(
                    error instanceof Error ? error : new Error(String(error))
                )
            );
        }
        if (viewer.isFail()) {
            return Result.fail(viewer.error);
        }

        // A missing or hidden page is unreadable, so the answer reveals nothing about which pages
        // exist; a failed read or access check is a persistence error (R87).
        let canRead: boolean;
        try {
            const target = await this.targets.read({
                model: WB_PAGE_NAMESPACE,
                targetRevisionId: input.targetRevisionId
            });
            canRead = !!target && (await this.access.canRead(target));
        } catch (error) {
            return Result.fail(
                new ReviewPersistenceError(
                    error instanceof Error ? error : new Error(String(error))
                )
            );
        }
        if (!canRead) {
            return Result.fail(new WorkflowsNotAuthorizedError({ action: "view this review" }));
        }

        const review = await this.getTargetReview.execute({
            model: WB_PAGE_NAMESPACE,
            targetRevisionId: input.targetRevisionId
        });
        if (review.isFail()) {
            return Result.fail(review.error);
        }
        if (!review.value) {
            return Result.ok(null);
        }

        const assignments = await this.listAssignments.execute({ reviewId: review.value.id });
        if (assignments.isFail()) {
            return Result.fail(assignments.error);
        }

        const visible = redactAssignmentRecords(assignments.value, viewer.value.permissions);
        return Result.ok({
            review: attachAssignmentRecords(review.value, visible),
            flags: getReviewViewerFlags(review.value, viewer.value)
        });
    }
}

export const GetWebsiteBuilderPageTargetReviewUseCase = UseCase.createImplementation({
    implementation: GetWebsiteBuilderPageTargetReviewUseCaseImpl,
    dependencies: [
        CurrentReviewViewer,
        WbPageTargetReader,
        WbPageAccess,
        GetTargetReviewUseCase,
        ListReviewAssignmentsUseCase
    ]
});
