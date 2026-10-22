import { Result } from "@webiny/feature/api";
import { CurrentReviewViewer } from "@webiny/api-workflows/features/identity/CurrentReviewViewer/index.js";
import { ListTargetReviewsUseCase } from "@webiny/api-workflows/features/review/ListTargetReviews/index.js";
import { CancelTargetReviewsUseCase } from "@webiny/api-workflows/features/review/CancelTargetReviews/index.js";
import { WorkflowsNotAuthorizedError } from "@webiny/api-workflows/domain/permissions/errors.js";
import {
    ReviewPersistenceError,
    ReviewTargetNotFoundError
} from "@webiny/api-workflows/domain/review/errors.js";
import { getDeleteCancelReason } from "@webiny/api-workflows/domain/review/getDeleteCancelReason.js";
import { CmsEntryTargetReader } from "~/features/target/CmsEntryTargetReader/index.js";
import { CmsEntryAccess } from "~/features/target/CmsEntryAccess/index.js";
import { isCmsNamespace } from "~/utils/appName.js";
import { CancelCmsEntryReviewsForDeleteUseCase as UseCase } from "./abstractions.js";

class CancelCmsEntryReviewsForDeleteUseCaseImpl implements UseCase.Interface {
    public constructor(
        private viewer: CurrentReviewViewer.Interface,
        private listTargetReviews: ListTargetReviewsUseCase.Interface,
        private targets: CmsEntryTargetReader.Interface,
        private access: CmsEntryAccess.Interface,
        private cancelTargetReviews: CancelTargetReviewsUseCase.Interface
    ) {}

    public async execute(input: UseCase.Input): UseCase.Return {
        const actor = this.viewer.getActor();
        if (actor.isFail()) {
            return Result.fail(actor.error);
        }
        if (!isCmsNamespace(input.model)) {
            return Result.fail(
                new ReviewTargetNotFoundError({ model: input.model, targetId: input.targetId })
            );
        }

        // Model-level check first: the answer must not reveal whether content has a review in
        // progress or exists at all (R86, same as R75).
        let canDeleteAnyEntry: boolean;
        try {
            canDeleteAnyEntry = await this.access.canDeleteAnyEntry(input.model);
        } catch (error) {
            return Result.fail(
                new ReviewPersistenceError(
                    error instanceof Error ? error : new Error(String(error))
                )
            );
        }
        if (!canDeleteAnyEntry) {
            return Result.fail(
                new WorkflowsNotAuthorizedError({
                    action: "cancel the review to delete this content"
                })
            );
        }

        const reviews = await this.listTargetReviews.execute({
            model: input.model,
            targetId: input.targetId
        });
        if (reviews.isFail()) {
            return Result.fail(reviews.error);
        }
        const inProgress = reviews.value.filter(review => {
            if (review.state !== "inProgress") {
                return false;
            }
            return !input.targetRevisionId || review.targetRevisionId === input.targetRevisionId;
        });
        if (inProgress.length === 0) {
            return Result.ok([]);
        }

        // Entry permissions (own) and the folder are entry-level: one revision answers for all.
        const targetRevisionId = inProgress[0].targetRevisionId;
        let target: CmsEntryTargetReader.Target | null;
        try {
            target = await this.targets.read({ model: input.model, targetRevisionId });
        } catch (error) {
            return Result.fail(
                new ReviewPersistenceError(
                    error instanceof Error ? error : new Error(String(error))
                )
            );
        }
        if (!target || target.entry.entryId !== input.targetId) {
            return Result.fail(
                new ReviewTargetNotFoundError({ model: input.model, targetId: input.targetId })
            );
        }
        let canDelete: boolean;
        try {
            canDelete = await this.access.canDelete(target);
        } catch (error) {
            return Result.fail(
                new ReviewPersistenceError(
                    error instanceof Error ? error : new Error(String(error))
                )
            );
        }
        if (!canDelete) {
            return Result.fail(
                new WorkflowsNotAuthorizedError({
                    action: "cancel the review to delete this content"
                })
            );
        }

        // The reviews listed above; the engine does not list them again.
        return this.cancelTargetReviews.execute({
            reviews: inProgress,
            actor: actor.value,
            reason: getDeleteCancelReason(input.action)
        });
    }
}

export const CancelCmsEntryReviewsForDeleteUseCase = UseCase.createImplementation({
    implementation: CancelCmsEntryReviewsForDeleteUseCaseImpl,
    dependencies: [
        CurrentReviewViewer,
        ListTargetReviewsUseCase,
        CmsEntryTargetReader,
        CmsEntryAccess,
        CancelTargetReviewsUseCase
    ]
});
