import { Result } from "@webiny/feature/api";
import { getReviewViewerFlags } from "@webiny/api-workflows/domain/review/getReviewViewerFlags.js";
import { canReassignByPermission } from "@webiny/api-workflows/domain/review/canReassignByPermission.js";
import { WorkflowsNotAuthorizedError } from "@webiny/api-workflows/domain/permissions/errors.js";
import { ReviewPersistenceError } from "@webiny/api-workflows/domain/review/errors.js";
import { CurrentReviewViewer } from "@webiny/api-workflows/features/identity/CurrentReviewViewer/index.js";
import { ListReviewsUseCase } from "@webiny/api-workflows/features/review/ListReviews/index.js";
import { WbPageReviewReadFilter } from "~/features/target/WbPageReviewReadFilter/index.js";
import { ListWebsiteBuilderPageReviewsUseCase as UseCase } from "./abstractions.js";

class ListWebsiteBuilderPageReviewsUseCaseImpl implements UseCase.Interface {
    public constructor(
        private viewer: CurrentReviewViewer.Interface,
        private listReviews: ListReviewsUseCase.Interface,
        private readFilter: WbPageReviewReadFilter.Interface
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

        // Read access as the page list applies it, once per call, as query filters (Q77), so no
        // title of a page the viewer cannot read is listed (D76).
        const readFilter = await this.readFilter.build();
        if (readFilter.isFail()) {
            return Result.fail(readFilter.error);
        }
        const readable = readFilter.value;
        if (readable.models.length === 0 && readable.ownOnlyModels.length === 0) {
            return Result.ok({ items: [], meta: { cursor: null, hasMoreItems: false } });
        }

        const listed = await this.listReviews.execute({
            list: input.list,
            viewerUserId: reviewViewer.actor.id,
            viewerTeamIds: reviewViewer.teamIds,
            readFilter: readable,
            where: input.where,
            sort: input.sort,
            limit: input.limit,
            after: input.after
        });
        if (listed.isFail()) {
            return Result.fail(listed.error);
        }

        // Every row passed the read filter, so the flags apply as they are (A43).
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
    dependencies: [CurrentReviewViewer, ListReviewsUseCase, WbPageReviewReadFilter]
});
