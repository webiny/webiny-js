import { Result } from "@webiny/feature/api";
import { ListModelsUseCase } from "@webiny/api-headless-cms/features/contentModel/ListModels/index.js";
import { CurrentReviewViewer } from "@webiny/api-workflows/features/identity/CurrentReviewViewer/index.js";
import { ListReviewsUseCase } from "@webiny/api-workflows/features/review/ListReviews/index.js";
import { getReviewViewerFlags } from "@webiny/api-workflows/domain/review/getReviewViewerFlags.js";
import { canReassignByPermission } from "@webiny/api-workflows/domain/review/canReassignByPermission.js";
import type { ReviewData } from "@webiny/api-workflows/domain/review/types.js";
import { WorkflowsNotAuthorizedError } from "@webiny/api-workflows/domain/permissions/errors.js";
import { ReviewPersistenceError } from "@webiny/api-workflows/domain/review/errors.js";
import { CmsEntryTargetReader } from "~/features/target/CmsEntryTargetReader/index.js";
import { CmsEntryAccess } from "~/features/target/CmsEntryAccess/index.js";
import { toCmsNamespace } from "~/utils/appName.js";
import { isBindableModel } from "~/utils/isBindableModel.js";
import { ListCmsEntryReviewsUseCase as UseCase } from "./abstractions.js";

/** `ListModelsUseCase` fails with this when the identity can read no model at all. */
const MODEL_NOT_AUTHORIZED = "Cms/Model/NotAuthorized";

class ListCmsEntryReviewsUseCaseImpl implements UseCase.Interface {
    public constructor(
        private viewer: CurrentReviewViewer.Interface,
        private listModels: ListModelsUseCase.Interface,
        private listReviews: ListReviewsUseCase.Interface,
        private targets: CmsEntryTargetReader.Interface,
        private access: CmsEntryAccess.Interface
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

        // The models the viewer can read (R94); a viewer who can read none gets an empty page.
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
        const namespaces = (models.isOk() ? models.value : [])
            .filter(model => isBindableModel(model))
            .filter(model => modelId === null || modelId === undefined || model.modelId === modelId)
            .map(model => toCmsNamespace(model.modelId));
        if (namespaces.length === 0) {
            return Result.ok({ items: [], meta: { cursor: null, hasMoreItems: false } });
        }

        const page = await this.listReviews.execute({
            list: input.list,
            viewerUserId: viewer.value.actor.id,
            viewerTeamIds: viewer.value.teamIds,
            models: namespaces,
            where: listWhere,
            sort: input.sort ?? undefined,
            limit: input.limit ?? undefined,
            after: input.after ?? null,
            // The CMS's own read logic on the review's revision (R47, R94). A throw counts as
            // unreadable in the engine (R92).
            canRead: async (review: ReviewData): Promise<boolean> => {
                const target = await this.targets.read({
                    model: review.model,
                    targetRevisionId: review.targetRevisionId
                });
                if (!target || target.entry.entryId !== review.targetId) {
                    return false;
                }
                return this.access.canRead(target);
            }
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
        CmsEntryTargetReader,
        CmsEntryAccess
    ]
});
