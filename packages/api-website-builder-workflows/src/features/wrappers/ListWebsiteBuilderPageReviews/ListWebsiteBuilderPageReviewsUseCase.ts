import { Result } from "@webiny/feature/api";
import type { ReviewData } from "@webiny/api-workflows/domain/review/types.js";
import { getReviewViewerFlags } from "@webiny/api-workflows/domain/review/getReviewViewerFlags.js";
import { canReassignByPermission } from "@webiny/api-workflows/domain/review/canReassignByPermission.js";
import { WorkflowsNotAuthorizedError } from "@webiny/api-workflows/domain/permissions/errors.js";
import { ReviewPersistenceError } from "@webiny/api-workflows/domain/review/errors.js";
import { CurrentReviewViewer } from "@webiny/api-workflows/features/identity/CurrentReviewViewer/index.js";
import { ListReviewsUseCase } from "@webiny/api-workflows/features/review/ListReviews/index.js";
import { WbPageTargetReader } from "~/features/target/WbPageTargetReader/index.js";
import { WbPageAccess } from "~/features/target/WbPageAccess/index.js";
import { WB_PAGE_NAMESPACE } from "~/constants.js";
import { ListWebsiteBuilderPageReviewsUseCase as UseCase } from "./abstractions.js";

class ListWebsiteBuilderPageReviewsUseCaseImpl implements UseCase.Interface {
    public constructor(
        private viewer: CurrentReviewViewer.Interface,
        private listReviews: ListReviewsUseCase.Interface,
        private targets: WbPageTargetReader.Interface,
        private access: WbPageAccess.Interface
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
        const reviewViewer = viewer.value;

        if (input.list === "failedSteps" && !canReassignByPermission(reviewViewer)) {
            return Result.fail(new WorkflowsNotAuthorizedError({ action: "list failed steps" }));
        }

        const listed = await this.listReviews.execute({
            list: input.list,
            viewerUserId: reviewViewer.actor.id,
            viewerTeamIds: reviewViewer.teamIds,
            models: [WB_PAGE_NAMESPACE],
            where: input.where,
            sort: input.sort,
            limit: input.limit,
            after: input.after,
            // A missing page, another page's revision or no read access hides the row; the
            // engine counts a throw as unreadable (R92), so no title of a hidden page leaks (D76).
            canRead: async (review: ReviewData) => {
                const target = await this.targets.read({
                    model: review.model,
                    targetRevisionId: review.targetRevisionId
                });
                if (!target || target.page.entryId !== review.targetId) {
                    return false;
                }
                return this.access.canRead(target);
            }
        });
        if (listed.isFail()) {
            return Result.fail(listed.error);
        }

        // Every row passed the read predicate, so the flags apply as they are (A43).
        return Result.ok({
            items: listed.value.items.map(review => {
                return { review, flags: getReviewViewerFlags(review, reviewViewer) };
            }),
            meta: listed.value.meta
        });
    }
}

export const ListWebsiteBuilderPageReviewsUseCase = UseCase.createImplementation({
    implementation: ListWebsiteBuilderPageReviewsUseCaseImpl,
    dependencies: [CurrentReviewViewer, ListReviewsUseCase, WbPageTargetReader, WbPageAccess]
});
