import { Result } from "@webiny/feature/api";
import { CurrentReviewViewer } from "@webiny/api-workflows/features/identity/CurrentReviewViewer/index.js";
import { GetTargetReviewUseCase } from "@webiny/api-workflows/features/review/GetTargetReview/index.js";
import { ListReviewAssignmentsUseCase } from "@webiny/api-workflows/features/assignment/ListReviewAssignments/index.js";
import { getReviewViewerFlags } from "@webiny/api-workflows/domain/review/getReviewViewerFlags.js";
import { redactAssignmentRecords } from "@webiny/api-workflows/domain/assignment/redactAssignmentRecords.js";
import { attachAssignmentRecords } from "@webiny/api-workflows/domain/assignment/attachAssignmentRecords.js";
import { WorkflowsNotAuthorizedError } from "@webiny/api-workflows/domain/permissions/errors.js";
import {
    ReviewPersistenceError,
    ReviewTargetNotFoundError
} from "@webiny/api-workflows/domain/review/errors.js";
import { CmsEntryTargetReader } from "~/features/target/CmsEntryTargetReader/index.js";
import { CmsEntryAccess } from "~/features/target/CmsEntryAccess/index.js";
import { isCmsNamespace } from "~/utils/appName.js";
import { GetCmsEntryTargetReviewUseCase as UseCase } from "./abstractions.js";

class GetCmsEntryTargetReviewUseCaseImpl implements UseCase.Interface {
    public constructor(
        private viewer: CurrentReviewViewer.Interface,
        private targets: CmsEntryTargetReader.Interface,
        private access: CmsEntryAccess.Interface,
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

        // Another app's namespace is not found (R46, R108).
        if (!isCmsNamespace(input.model)) {
            return Result.fail(
                new ReviewTargetNotFoundError({
                    model: input.model,
                    targetRevisionId: input.targetRevisionId
                })
            );
        }

        // A missing, trashed or unreadable revision is refused alike, so the answer does not
        // reveal whether it exists (R108); a failed read or access check is a persistence error
        // (R87).
        let canRead: boolean;
        try {
            const target = await this.targets.read({
                model: input.model,
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
            model: input.model,
            targetRevisionId: input.targetRevisionId
        });
        if (review.isFail()) {
            return Result.fail(review.error);
        }
        if (!review.value) {
            return Result.ok(null);
        }

        const records = await this.listAssignments.execute({ reviewId: review.value.id });
        if (records.isFail()) {
            return Result.fail(records.error);
        }
        const visible = redactAssignmentRecords(records.value, viewer.value.permissions);
        return Result.ok({
            review: attachAssignmentRecords(review.value, visible),
            flags: getReviewViewerFlags(review.value, viewer.value)
        });
    }
}

export const GetCmsEntryTargetReviewUseCase = UseCase.createImplementation({
    implementation: GetCmsEntryTargetReviewUseCaseImpl,
    dependencies: [
        CurrentReviewViewer,
        CmsEntryTargetReader,
        CmsEntryAccess,
        GetTargetReviewUseCase,
        ListReviewAssignmentsUseCase
    ]
});
