import { Result } from "@webiny/feature/api";
import { GetModelUseCase } from "@webiny/api-headless-cms/features/contentModel/GetModel/index.js";
import { GetLatestEntriesByIdsUseCase } from "@webiny/api-headless-cms/features/contentEntry/GetLatestEntriesByIds/index.js";
import { CurrentReviewViewer } from "@webiny/api-workflows/features/identity/CurrentReviewViewer/index.js";
import { GetBoundWorkflowUseCase } from "@webiny/api-workflows/features/workflow/GetBoundWorkflow/index.js";
import { ListReviewsByTargetsUseCase } from "@webiny/api-workflows/features/review/ListReviewsByTargets/index.js";
import {
    ReviewPersistenceError,
    ReviewValidationError
} from "@webiny/api-workflows/domain/review/errors.js";
import { toBlockingReview } from "@webiny/api-workflows/domain/review/toBlockingReview.js";
import type { ReviewData } from "@webiny/api-workflows/domain/review/types.js";
import type { WorkflowBlockingReview } from "@webiny/api-workflows/domain/workflow/types.js";
import { CmsEntryAccess } from "~/features/target/CmsEntryAccess/index.js";
import { UNREADABLE_CODES } from "~/features/target/CmsEntryAccess/index.js";
import { CmsModelGroupService } from "~/features/target/CmsModelGroupService/index.js";
import { CmsEntryDeniedFolders } from "~/features/target/CmsEntryDeniedFolders/index.js";
import { getCmsNamespace } from "~/utils/appName.js";
import {
    BLOCKING_REVIEWS_MAX_IDS,
    ListCmsEntryBlockingReviewsUseCase as UseCase
} from "./abstractions.js";

/** The viewer has no entry permission at all, so no entry is readable. */
const ENTRIES_NOT_AUTHORIZED = "Cms/Entry/NotAuthorized";

class ListCmsEntryBlockingReviewsUseCaseImpl implements UseCase.Interface {
    public constructor(
        private viewer: CurrentReviewViewer.Interface,
        private getModel: GetModelUseCase.Interface,
        private modelGroups: CmsModelGroupService.Interface,
        private getBoundWorkflow: GetBoundWorkflowUseCase.Interface,
        private listReviewsByTargets: ListReviewsByTargetsUseCase.Interface,
        private getLatestEntries: GetLatestEntriesByIdsUseCase.Interface,
        private access: CmsEntryAccess.Interface,
        private deniedFolders: CmsEntryDeniedFolders.Interface
    ) {}

    public async execute(input: UseCase.Input): UseCase.Return {
        const actor = this.viewer.getActor();
        if (actor.isFail()) {
            return Result.fail(actor.error);
        }
        if (input.entryIds.length > BLOCKING_REVIEWS_MAX_IDS) {
            return Result.fail(
                new ReviewValidationError(
                    `At most ${BLOCKING_REVIEWS_MAX_IDS} entries can be checked at once.`
                )
            );
        }
        const entryIds = Array.from(new Set(input.entryIds));
        if (entryIds.length === 0) {
            return Result.ok([]);
        }

        // Every dependency failure and throw below is a failed Result (R87).
        try {
            const model = await this.getModel.execute(input.modelId);
            if (model.isFail()) {
                if (UNREADABLE_CODES.includes(model.error.code)) {
                    return Result.ok([]);
                }
                return Result.fail(new ReviewPersistenceError(model.error));
            }
            // `null` for a private model.
            const namespace = getCmsNamespace(model.value);
            if (!namespace) {
                return Result.ok([]);
            }
            const group = await this.modelGroups.getGroup(model.value);
            if (group.isFail()) {
                if (UNREADABLE_CODES.includes(group.error.code)) {
                    return Result.ok([]);
                }
                return Result.fail(new ReviewPersistenceError(group.error));
            }

            const bound = await this.getBoundWorkflow.execute({ model: namespace });
            if (bound.isFail()) {
                return Result.fail(bound.error);
            }
            if (!bound.value) {
                return Result.ok([]);
            }

            // One engine call for every entry (Q79): one query per 100 ids, confirmed in a batch.
            const listed = await this.listReviewsByTargets.execute({
                model: namespace,
                targetIds: entryIds,
                state: "inProgress"
            });
            if (listed.isFail()) {
                return Result.fail(listed.error);
            }
            const inProgress = new Map<string, ReviewData[]>();
            for (const review of listed.value) {
                const reviews = inProgress.get(review.targetId) ?? [];
                reviews.push(review);
                inProgress.set(review.targetId, reviews);
            }
            if (inProgress.size === 0) {
                return Result.ok([]);
            }

            // The entry permissions (own) and the folder are entry-level, so the latest
            // revision answers for every revision of the entry.
            const idsWithReviews = entryIds.filter(entryId => inProgress.has(entryId));
            const latest = await this.getLatestEntries.execute(model.value, idsWithReviews);
            if (latest.isFail()) {
                if (latest.error.code === ENTRIES_NOT_AUTHORIZED) {
                    return Result.ok([]);
                }
                return Result.fail(new ReviewPersistenceError(latest.error));
            }
            // The folder rules are read once for the model; every check below is in memory.
            const folderRule = await this.deniedFolders.createFolderReadRule([model.value.modelId]);
            const readableIds = new Set<string>();
            for (const entry of latest.value) {
                // oxlint-disable-next-line no-await-in-loop -- in memory: the folder rule and permissions are already loaded.
                const canRead = await this.access.canRead(
                    { model: model.value, group: group.value, entry },
                    folderRule
                );
                if (canRead) {
                    readableIds.add(entry.entryId);
                }
            }

            // In the order of the input ids, each entry's reviews in list order.
            const blocking: WorkflowBlockingReview[] = [];
            for (const entryId of entryIds) {
                if (!readableIds.has(entryId)) {
                    continue;
                }
                const reviews = inProgress.get(entryId) ?? [];
                for (const review of reviews) {
                    blocking.push(toBlockingReview(review));
                }
            }
            return Result.ok(blocking);
        } catch (error) {
            const cause = error instanceof Error ? error : new Error(String(error));
            return Result.fail(new ReviewPersistenceError(cause));
        }
    }
}

export const ListCmsEntryBlockingReviewsUseCase = UseCase.createImplementation({
    implementation: ListCmsEntryBlockingReviewsUseCaseImpl,
    dependencies: [
        CurrentReviewViewer,
        GetModelUseCase,
        CmsModelGroupService,
        GetBoundWorkflowUseCase,
        ListReviewsByTargetsUseCase,
        GetLatestEntriesByIdsUseCase,
        CmsEntryAccess,
        CmsEntryDeniedFolders
    ]
});
