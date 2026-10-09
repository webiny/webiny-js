import { Result } from "@webiny/feature/api";
import { createIdentifier } from "@webiny/utils";
import type { CmsModel } from "@webiny/api-headless-cms/types/index.js";
import { CreateEntryUseCase } from "@webiny/api-headless-cms/features/contentEntry/CreateEntry/index.js";
import { UpdateEntryUseCase } from "@webiny/api-headless-cms/features/contentEntry/UpdateEntry/index.js";
import { GetEntryByIdUseCase } from "@webiny/api-headless-cms/features/contentEntry/GetEntryById/index.js";
import { ListLatestEntriesUseCase } from "@webiny/api-headless-cms/features/contentEntry/ListEntries/index.js";
import { ReviewModelProvider } from "~/domain/review/abstractions/ReviewModelProvider.js";
import { ReviewRepository as Abstraction } from "~/domain/review/abstractions/ReviewRepository.js";
import { ReviewNotFoundError, ReviewPersistenceError } from "~/domain/review/errors.js";
import type { ReviewData } from "~/domain/review/types.js";
import { ReviewEntryMapper, type ReviewEntryValues } from "./ReviewEntryMapper.js";

const ENTRY_NOT_FOUND = "Cms/Entry/NotFound";
/** At most one review per revision is active (D23); a few extra hits cover stale list results. */
const ACTIVE_BY_TARGET_LIMIT = 10;
const COUNT_PAGE_SIZE = 100;

/**
 * Lists go through `ListLatestEntriesUseCase`, which reads OpenSearch on ddb-os. OpenSearch is
 * filled asynchronously, so a listed hit can be stale (a cancelled review still `isActive: true`)
 * and a just-written review can be missing. Every hit is confirmed with a primary-storage read
 * before `isActive` or `state` is trusted (R18). A review written but not yet indexed is still
 * missed: two concurrent requests on one revision can both pass, and a delete can pass while a
 * request is in flight. That race is accepted, like D27 and D15.
 */
class ReviewRepositoryImpl implements Abstraction.Interface {
    constructor(
        private modelProvider: ReviewModelProvider.Interface,
        private getEntryById: GetEntryByIdUseCase.Interface,
        private listLatestEntries: ListLatestEntriesUseCase.Interface,
        private createEntry: CreateEntryUseCase.Interface,
        private updateEntry: UpdateEntryUseCase.Interface
    ) {}

    async get(
        id: string
    ): Promise<Result<ReviewData, ReviewNotFoundError | ReviewPersistenceError>> {
        const model = await this.modelProvider.get();
        const result = await this.getEntryById.execute<ReviewEntryValues>(
            model,
            createIdentifier({ id, version: 1 })
        );
        if (result.isFail()) {
            if (result.error.code === ENTRY_NOT_FOUND) {
                return Result.fail(new ReviewNotFoundError({ id }));
            }
            return Result.fail(new ReviewPersistenceError(result.error));
        }
        return Result.ok(ReviewEntryMapper.fromEntry(result.value));
    }

    async getActiveByTarget(
        params: Abstraction.ActiveByTargetParams
    ): Promise<Result<ReviewData | null, ReviewPersistenceError>> {
        const model = await this.modelProvider.get();
        const result = await this.listLatestEntries.execute<ReviewEntryValues>(model, {
            where: {
                values: {
                    model: params.model,
                    targetRevisionId: params.targetRevisionId,
                    isActive: true
                }
            },
            sort: ["createdOn_DESC"],
            limit: ACTIVE_BY_TARGET_LIMIT
        });
        if (result.isFail()) {
            return Result.fail(new ReviewPersistenceError(result.error));
        }

        for (const entry of result.value.entries) {
            const confirmed = await this.readPrimary(model, entry.id);
            if (confirmed.isFail()) {
                return Result.fail(confirmed.error);
            }
            const review = confirmed.value;
            if (
                review &&
                review.isActive &&
                review.model === params.model &&
                review.targetRevisionId === params.targetRevisionId
            ) {
                return Result.ok(review);
            }
        }
        return Result.ok(null);
    }

    async countInProgressByWorkflow(
        workflowId: string
    ): Promise<Result<number, ReviewPersistenceError>> {
        const model = await this.modelProvider.get();
        let count = 0;
        let after: string | null = null;
        do {
            const result: Awaited<ListLatestEntriesUseCase.Return<ReviewEntryValues>> =
                await this.listLatestEntries.execute<ReviewEntryValues>(model, {
                    where: {
                        values: {
                            workflowId,
                            state: "inProgress"
                        }
                    },
                    sort: ["createdOn_ASC"],
                    limit: COUNT_PAGE_SIZE,
                    after
                });
            if (result.isFail()) {
                return Result.fail(new ReviewPersistenceError(result.error));
            }

            for (const entry of result.value.entries) {
                const confirmed = await this.readPrimary(model, entry.id);
                if (confirmed.isFail()) {
                    return Result.fail(confirmed.error);
                }
                const review = confirmed.value;
                if (review && review.workflowId === workflowId && review.state === "inProgress") {
                    count++;
                }
            }

            const { meta } = result.value;
            after = meta.hasMoreItems ? meta.cursor : null;
        } while (after);

        return Result.ok(count);
    }

    async save(review: ReviewData): Promise<Result<ReviewData, ReviewPersistenceError>> {
        const model = await this.modelProvider.get();
        const id = createIdentifier({ id: review.id, version: 1 });
        const values = ReviewEntryMapper.toValues(review);

        const existing = await this.getEntryById.execute<ReviewEntryValues>(model, id);
        if (existing.isFail() && existing.error.code !== ENTRY_NOT_FOUND) {
            return Result.fail(new ReviewPersistenceError(existing.error));
        }

        if (existing.isOk()) {
            const updated = await this.updateEntry.execute<ReviewEntryValues>(model, id, {
                values
            });
            if (updated.isFail()) {
                return Result.fail(new ReviewPersistenceError(updated.error));
            }
            return Result.ok(ReviewEntryMapper.fromEntry(updated.value));
        }

        const created = await this.createEntry.execute<ReviewEntryValues>(model, {
            id: review.id,
            // The aggregate's `now`, so `createdOn` matches the `requested` fact (A5).
            createdOn: review.createdOn,
            values
        });
        if (created.isFail()) {
            return Result.fail(new ReviewPersistenceError(created.error));
        }
        return Result.ok(ReviewEntryMapper.fromEntry(created.value));
    }

    /** Primary-storage read of a listed entry; `null` when it was deleted after it was listed. */
    private async readPrimary(
        model: CmsModel,
        entryId: string
    ): Promise<Result<ReviewData | null, ReviewPersistenceError>> {
        const result = await this.getEntryById.execute<ReviewEntryValues>(model, entryId);
        if (result.isFail()) {
            if (result.error.code === ENTRY_NOT_FOUND) {
                return Result.ok(null);
            }
            return Result.fail(new ReviewPersistenceError(result.error));
        }
        return Result.ok(ReviewEntryMapper.fromEntry(result.value));
    }
}

export const ReviewRepository = Abstraction.createImplementation({
    implementation: ReviewRepositoryImpl,
    dependencies: [
        ReviewModelProvider,
        GetEntryByIdUseCase,
        ListLatestEntriesUseCase,
        CreateEntryUseCase,
        UpdateEntryUseCase
    ]
});
