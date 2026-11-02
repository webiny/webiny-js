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
import { WbPageTargetReader } from "~/features/target/WbPageTargetReader/index.js";
import { WbPageAccess } from "~/features/target/WbPageAccess/index.js";
import { WB_PAGE_NAMESPACE } from "~/constants.js";
import { CancelWebsiteBuilderPageReviewsForDeleteUseCase as UseCase } from "./abstractions.js";

class CancelWebsiteBuilderPageReviewsForDeleteUseCaseImpl implements UseCase.Interface {
    public constructor(
        private viewer: CurrentReviewViewer.Interface,
        private listTargetReviews: ListTargetReviewsUseCase.Interface,
        private targets: WbPageTargetReader.Interface,
        private access: WbPageAccess.Interface,
        private cancelTargetReviews: CancelTargetReviewsUseCase.Interface
    ) {}

    public async execute(input: UseCase.Input): UseCase.Return {
        const actor = this.viewer.getActor();
        if (actor.isFail()) {
            return Result.fail(actor.error);
        }

        // Entity-level check first: the answer must not reveal whether a page has a review in
        // progress or exists at all (R86, same as R75).
        let canDeleteAnyPage: boolean;
        try {
            canDeleteAnyPage = await this.access.canDeleteAnyPage();
        } catch (error) {
            return Result.fail(
                new ReviewPersistenceError(
                    error instanceof Error ? error : new Error(String(error))
                )
            );
        }
        if (!canDeleteAnyPage) {
            return Result.fail(
                new WorkflowsNotAuthorizedError({
                    action: "cancel the review to delete this content"
                })
            );
        }

        const reviews = await this.listTargetReviews.execute({
            model: WB_PAGE_NAMESPACE,
            targetId: input.targetId,
            targetRevisionId: input.targetRevisionId ?? undefined,
            state: "inProgress"
        });
        if (reviews.isFail()) {
            return Result.fail(reviews.error);
        }
        const inProgress = reviews.value;
        if (inProgress.length === 0) {
            return Result.ok([]);
        }

        // Page permissions (own) and the folder are page-level: one revision answers for all.
        const targetRevisionId = inProgress[0].targetRevisionId;
        let target: WbPageTargetReader.Target | null;
        try {
            target = await this.targets.read({ model: WB_PAGE_NAMESPACE, targetRevisionId });
        } catch (error) {
            return Result.fail(
                new ReviewPersistenceError(
                    error instanceof Error ? error : new Error(String(error))
                )
            );
        }
        if (!target || target.page.entryId !== input.targetId) {
            return Result.fail(
                new ReviewTargetNotFoundError({
                    model: WB_PAGE_NAMESPACE,
                    targetId: input.targetId
                })
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
        // A user who may delete some pages but not this one gets the answer of a page without a
        // review, so the answer never shows a review (R86). Nothing is cancelled: the delete that
        // follows runs the Website Builder checks and refuses this user on its own.
        if (!canDelete) {
            return Result.ok([]);
        }

        // The reviews listed above; the engine does not list them again.
        return this.cancelTargetReviews.execute({
            reviews: inProgress,
            actor: actor.value,
            reason: getDeleteCancelReason(input.action)
        });
    }
}

export const CancelWebsiteBuilderPageReviewsForDeleteUseCase = UseCase.createImplementation({
    implementation: CancelWebsiteBuilderPageReviewsForDeleteUseCaseImpl,
    dependencies: [
        CurrentReviewViewer,
        ListTargetReviewsUseCase,
        WbPageTargetReader,
        WbPageAccess,
        CancelTargetReviewsUseCase
    ]
});
