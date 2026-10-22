import { Result } from "@webiny/feature/api";
import { ListModelsUseCase } from "@webiny/api-headless-cms/features/contentModel/ListModels/index.js";
import { CurrentReviewViewer } from "@webiny/api-workflows/features/identity/CurrentReviewViewer/index.js";
import { ListReviewsUseCase } from "@webiny/api-workflows/features/review/ListReviews/index.js";
import { getReviewViewerFlags } from "@webiny/api-workflows/domain/review/getReviewViewerFlags.js";
import { canReassignByPermission } from "@webiny/api-workflows/domain/review/canReassignByPermission.js";
import { WorkflowsNotAuthorizedError } from "@webiny/api-workflows/domain/permissions/errors.js";
import { ReviewPersistenceError } from "@webiny/api-workflows/domain/review/errors.js";
import { CmsEntryReviewReadFilter } from "~/features/target/CmsEntryReviewReadFilter/index.js";
import { isBindableModel } from "~/utils/isBindableModel.js";
import { ListCmsEntryReviewsUseCase as UseCase } from "./abstractions.js";

/** `ListModelsUseCase` fails with this when the identity can read no model at all. */
const MODEL_NOT_AUTHORIZED = "Cms/Model/NotAuthorized";

class ListCmsEntryReviewsUseCaseImpl implements UseCase.Interface {
    public constructor(
        private viewer: CurrentReviewViewer.Interface,
        private listModels: ListModelsUseCase.Interface,
        private listReviews: ListReviewsUseCase.Interface,
        private readFilter: CmsEntryReviewReadFilter.Interface
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
        if (input.list === "failedSteps" && !canReassignByPermission(viewer.value)) {
            return Result.fail(new WorkflowsNotAuthorizedError({ action: "list failed steps" }));
        }

        // The models the viewer can list (R94); a viewer who can read none gets an empty page.
        let models: Awaited<ListModelsUseCase.Return>;
        try {
            models = await this.listModels.execute({ includePrivate: false, includePlugins: true });
        } catch (error) {
            return Result.fail(
                new ReviewPersistenceError(
                    error instanceof Error ? error : new Error(String(error))
                )
            );
        }
        if (models.isFail() && models.error.code !== MODEL_NOT_AUTHORIZED) {
            return Result.fail(new ReviewPersistenceError(models.error));
        }
        const where: UseCase.Where = input.where ?? {};
        const { modelId, ...listWhere } = where;
        const listedModels = (models.isOk() ? models.value : [])
            .filter(model => isBindableModel(model))
            .filter(
                model => modelId === null || modelId === undefined || model.modelId === modelId
            );

        // Read access as the CMS entry list applies it, once per call, as query filters (Q77).
        const readFilter = await this.readFilter.build(listedModels);
        if (readFilter.isFail()) {
            return Result.fail(readFilter.error);
        }
        const readable = readFilter.value;
        if (readable.models.length === 0 && readable.ownOnlyModels.length === 0) {
            return Result.ok({ items: [], meta: { cursor: null, hasMoreItems: false } });
        }

        const page = await this.listReviews.execute({
            list: input.list,
            viewerUserId: viewer.value.actor.id,
            viewerTeamIds: viewer.value.teamIds,
            readFilter: readable,
            where: listWhere,
            sort: input.sort ?? undefined,
            limit: input.limit ?? undefined,
            after: input.after ?? null
        });
        if (page.isFail()) {
            return Result.fail(page.error);
        }

        // A listed row is readable by construction; the flags need no target access (A43).
        return Result.ok({
            items: page.value.items.map(review => {
                return { review, flags: getReviewViewerFlags(review, viewer.value) };
            }),
            meta: page.value.meta
        });
    }
}

export const ListCmsEntryReviewsUseCase = UseCase.createImplementation({
    implementation: ListCmsEntryReviewsUseCaseImpl,
    dependencies: [
        CurrentReviewViewer,
        ListModelsUseCase,
        ListReviewsUseCase,
        CmsEntryReviewReadFilter
    ]
});
