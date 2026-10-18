import { Result } from "@webiny/feature/api";
import { GetModelUseCase } from "@webiny/api-headless-cms/features/contentModel/GetModel/index.js";
import { GetGroupUseCase } from "@webiny/api-headless-cms/features/contentModelGroup/GetGroup/index.js";
import { GetLatestEntriesByIdsUseCase } from "@webiny/api-headless-cms/features/contentEntry/GetLatestEntriesByIds/index.js";
import { CurrentReviewViewer } from "@webiny/api-workflows/features/identity/CurrentReviewViewer/index.js";
import { GetBoundWorkflowUseCase } from "@webiny/api-workflows/features/workflow/GetBoundWorkflow/index.js";
import { ListTargetReviewsUseCase } from "@webiny/api-workflows/features/review/ListTargetReviews/index.js";
import {
    ReviewPersistenceError,
    ReviewValidationError
} from "@webiny/api-workflows/domain/review/errors.js";
import { toBlockingReview } from "@webiny/api-workflows/domain/review/toBlockingReview.js";
import type { ReviewData } from "@webiny/api-workflows/domain/review/types.js";
import type { WorkflowBlockingReview } from "@webiny/api-workflows/domain/workflow/types.js";
import { CmsEntryAccess } from "~/features/target/CmsEntryAccess/index.js";
import { UNREADABLE_CODES } from "~/features/target/CmsEntryAccess/index.js";
import { getCmsNamespace } from "~/utils/appName.js";
import {
    BLOCKING_REVIEWS_CONCURRENCY,
    BLOCKING_REVIEWS_MAX_IDS,
    ListCmsEntryBlockingReviewsUseCase as UseCase
} from "./abstractions.js";

/** The viewer has no entry permission at all, so no entry is readable. */
const ENTRIES_NOT_AUTHORIZED = "Cms/Entry/NotAuthorized";

class ListCmsEntryBlockingReviewsUseCaseImpl implements UseCase.Interface {
    public constructor(
        private viewer: CurrentReviewViewer.Interface,
        private getModel: GetModelUseCase.Interface,
        private getGroup: GetGroupUseCase.Interface,
        private getBoundWorkflow: GetBoundWorkflowUseCase.Interface,
        private listTargetReviews: ListTargetReviewsUseCase.Interface,
        private getLatestEntries: GetLatestEntriesByIdsUseCase.Interface,
        private access: CmsEntryAccess.Interface
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
            const group = await this.getGroup.execute(model.value.group);
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

            const blocking: WorkflowBlockingReview[] = [];
            for (let start = 0; start < entryIds.length; start += BLOCKING_REVIEWS_CONCURRENCY) {
                const batch = entryIds.slice(start, start + BLOCKING_REVIEWS_CONCURRENCY);

                const lookups = await Promise.all(
                    batch.map(entryId => {
                        return this.listTargetReviews.execute({
                            model: namespace,
                            targetId: entryId
                        });
                    })
                );
                const inProgress = new Map<string, ReviewData[]>();
                for (let index = 0; index < batch.length; index++) {
                    const lookup = lookups[index];
                    if (lookup.isFail()) {
                        return Result.fail(lookup.error);
                    }
                    const reviews = lookup.value.filter(review => review.state === "inProgress");
                    if (reviews.length > 0) {
                        inProgress.set(batch[index], reviews);
                    }
                }
                if (inProgress.size === 0) {
                    continue;
                }

                // The entry permissions (own) and the folder are entry-level, so the latest
                // revision answers for every revision of the entry.
                const idsWithReviews = Array.from(inProgress.keys());
                const latest = await this.getLatestEntries.execute(model.value, idsWithReviews);
                if (latest.isFail()) {
                    if (latest.error.code === ENTRIES_NOT_AUTHORIZED) {
                        return Result.ok([]);
                    }
                    return Result.fail(new ReviewPersistenceError(latest.error));
                }
                const readable = await Promise.all(
                    latest.value.map(entry => {
                        return this.access.canRead({
                            model: model.value,
                            group: group.value,
                            entry
                        });
                    })
                );
                const readableIds = new Set<string>();
                for (let index = 0; index < latest.value.length; index++) {
                    if (readable[index]) {
                        readableIds.add(latest.value[index].entryId);
                    }
                }

                for (const entryId of batch) {
                    if (!readableIds.has(entryId)) {
                        continue;
                    }
                    const reviews = inProgress.get(entryId) ?? [];
                    for (const review of reviews) {
                        blocking.push(toBlockingReview(review));
                    }
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
        GetGroupUseCase,
        GetBoundWorkflowUseCase,
        ListTargetReviewsUseCase,
        GetLatestEntriesByIdsUseCase,
        CmsEntryAccess
    ]
});
