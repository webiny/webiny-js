import { Result } from "@webiny/feature/api";
import { CurrentReviewViewer } from "@webiny/api-workflows/features/identity/CurrentReviewViewer/index.js";
import { GetReviewUseCase } from "@webiny/api-workflows/features/review/GetReview/index.js";
import { WorkflowsNotAuthorizedError } from "@webiny/api-workflows/domain/permissions/errors.js";
import {
    ReviewNotFoundError,
    ReviewPersistenceError
} from "@webiny/api-workflows/domain/review/errors.js";
import { CmsEntryTargetReader } from "~/features/target/CmsEntryTargetReader/index.js";
import { CmsEntryAccess } from "~/features/target/CmsEntryAccess/index.js";
import { isCmsNamespace } from "~/utils/appName.js";
import { CmsEntryReviewGuardService as Abstraction } from "./abstractions.js";

class CmsEntryReviewGuardServiceImpl implements Abstraction.Interface {
    public constructor(
        private viewer: CurrentReviewViewer.Interface,
        private getReview: GetReviewUseCase.Interface,
        private targets: CmsEntryTargetReader.Interface,
        private access: CmsEntryAccess.Interface
    ) {}

    public async authorize(params: Abstraction.Params): Abstraction.Return {
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

        const review = await this.getReview.execute({ id: params.reviewId });
        if (review.isFail()) {
            return Result.fail(review.error);
        }
        if (!isCmsNamespace(review.value.model)) {
            return Result.fail(new ReviewNotFoundError({ id: params.reviewId }));
        }

        // A target that is missing, hidden or not the review's own entry is unreadable; a failed
        // read or access check is a persistence error (R87).
        let canRead: boolean;
        try {
            const target = await this.targets.read({
                model: review.value.model,
                targetRevisionId: review.value.targetRevisionId
            });
            const isReviewTarget = target?.entry.entryId === review.value.targetId;
            canRead = !!target && isReviewTarget && (await this.access.canRead(target));
        } catch (error) {
            return Result.fail(
                new ReviewPersistenceError(
                    error instanceof Error ? error : new Error(String(error))
                )
            );
        }
        if (!canRead) {
            return Result.fail(new WorkflowsNotAuthorizedError({ action: params.action }));
        }

        return Result.ok({ review: review.value, viewer: viewer.value });
    }
}

export const CmsEntryReviewGuardService = Abstraction.createImplementation({
    implementation: CmsEntryReviewGuardServiceImpl,
    dependencies: [CurrentReviewViewer, GetReviewUseCase, CmsEntryTargetReader, CmsEntryAccess]
});
