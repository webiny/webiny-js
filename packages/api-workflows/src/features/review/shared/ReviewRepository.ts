import { Result } from "@webiny/feature/api";
import { createIdentifier } from "@webiny/utils";
import type { CmsEntryListWhereValues } from "@webiny/api-headless-cms/types/index.js";
import { CreateEntryUseCase } from "@webiny/api-headless-cms/features/contentEntry/CreateEntry/index.js";
import { DeleteEntryUseCase } from "@webiny/api-headless-cms/features/contentEntry/DeleteEntry/index.js";
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
        private updateEntry: UpdateEntryUseCase.Interface,
        private deleteEntry: DeleteEntryUseCase.Interface
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
            // Primary-storage read of a listed entry; `null` when it was deleted after it was listed.
            const primary = await this.getEntryById.execute<ReviewEntryValues>(model, entry.id);
            let review: ReviewData | null = null;
            if (primary.isOk()) {
                review = ReviewEntryMapper.fromEntry(primary.value);
            } else if (primary.error.code !== ENTRY_NOT_FOUND) {
                return Result.fail(new ReviewPersistenceError(primary.error));
            }
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
        const listed = await this.listInProgressByWorkflow(workflowId);
        if (listed.isFail()) {
            return Result.fail(listed.error);
        }
        return Result.ok(listed.value.length);
    }

    async listInProgressByWorkflow(
        workflowId: string
    ): Promise<Result<ReviewData[], ReviewPersistenceError>> {
        const model = await this.modelProvider.get();
        const reviews: ReviewData[] = [];
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
                // Primary-storage read of a listed entry; `null` when it was deleted after it was listed.
                const primary = await this.getEntryById.execute<ReviewEntryValues>(model, entry.id);
                let review: ReviewData | null = null;
                if (primary.isOk()) {
                    review = ReviewEntryMapper.fromEntry(primary.value);
                } else if (primary.error.code !== ENTRY_NOT_FOUND) {
                    return Result.fail(new ReviewPersistenceError(primary.error));
                }
                if (review && review.workflowId === workflowId && review.state === "inProgress") {
                    reviews.push(review);
                }
            }

            const { meta } = result.value;
            after = meta.hasMoreItems ? meta.cursor : null;
        } while (after);

        return Result.ok(reviews);
    }

    async listInReviewByOwners(
        ownerIds: string[]
    ): Promise<Result<ReviewData[], ReviewPersistenceError>> {
        // An empty `In` list throws on OpenSearch (DDB returns nothing): answer without querying.
        if (ownerIds.length === 0) {
            return Result.ok([]);
        }
        const model = await this.modelProvider.get();
        const reviews: ReviewData[] = [];
        let after: string | null = null;
        do {
            const result: Awaited<ListLatestEntriesUseCase.Return<ReviewEntryValues>> =
                await this.listLatestEntries.execute<ReviewEntryValues>(model, {
                    where: {
                        values: {
                            currentOwnerId_in: [...ownerIds],
                            currentStepState: "inReview",
                            isActive: true
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
                // Index rows, not confirmed (A46); the filter is checked again on the row.
                const review = ReviewEntryMapper.fromEntry(entry);
                if (
                    review.isActive &&
                    review.currentStepState === "inReview" &&
                    review.currentOwnerId !== null &&
                    ownerIds.includes(review.currentOwnerId)
                ) {
                    reviews.push(review);
                }
            }

            const { meta } = result.value;
            after = meta.hasMoreItems ? meta.cursor : null;
        } while (after);

        return Result.ok(reviews);
    }

    async listByTarget(
        params: Abstraction.ByTargetParams
    ): Promise<Result<ReviewData[], ReviewPersistenceError>> {
        const model = await this.modelProvider.get();
        const values: CmsEntryListWhereValues = {
            model: params.model,
            targetId: params.targetId
        };
        if (params.targetRevisionId) {
            values.targetRevisionId = params.targetRevisionId;
        }

        const reviews: ReviewData[] = [];
        let after: string | null = null;
        do {
            const result: Awaited<ListLatestEntriesUseCase.Return<ReviewEntryValues>> =
                await this.listLatestEntries.execute<ReviewEntryValues>(model, {
                    where: { values },
                    sort: ["createdOn_ASC"],
                    limit: COUNT_PAGE_SIZE,
                    after
                });
            if (result.isFail()) {
                return Result.fail(new ReviewPersistenceError(result.error));
            }

            for (const entry of result.value.entries) {
                // Primary-storage read of a listed entry; `null` when it was deleted after it was listed.
                const primary = await this.getEntryById.execute<ReviewEntryValues>(model, entry.id);
                let review: ReviewData | null = null;
                if (primary.isOk()) {
                    review = ReviewEntryMapper.fromEntry(primary.value);
                } else if (primary.error.code !== ENTRY_NOT_FOUND) {
                    return Result.fail(new ReviewPersistenceError(primary.error));
                }
                if (
                    review &&
                    review.model === params.model &&
                    review.targetId === params.targetId &&
                    (!params.targetRevisionId ||
                        review.targetRevisionId === params.targetRevisionId)
                ) {
                    reviews.push(review);
                }
            }

            const { meta } = result.value;
            after = meta.hasMoreItems ? meta.cursor : null;
        } while (after);

        return Result.ok(reviews);
    }

    async list(
        params: Abstraction.ListParams
    ): Promise<Result<Abstraction.ListResult, ReviewPersistenceError>> {
        const { where } = params;
        // An empty `In` list throws on OpenSearch (DDB returns nothing): answer without querying.
        const emptyIn =
            where.model_in.length === 0 ||
            where.currentCandidateTeamIds_in?.length === 0 ||
            where.currentStepType_in?.length === 0;
        if (emptyIn) {
            return Result.ok({
                items: [],
                meta: { cursor: null, hasMoreItems: false, totalCount: 0 }
            });
        }

        const model = await this.modelProvider.get();
        const values: CmsEntryListWhereValues = { model_in: [...where.model_in] };
        if (where.isActive !== undefined) {
            values.isActive = where.isActive;
        }
        if (where.state !== undefined) {
            values.state = where.state;
        }
        if (where.currentStepState !== undefined) {
            values.currentStepState = where.currentStepState;
        }
        if (where.currentOwnerId !== undefined) {
            values.currentOwnerId = where.currentOwnerId;
        }
        if (where.currentOwnerId_not !== undefined) {
            values.currentOwnerId_not = where.currentOwnerId_not;
        }
        if (where.currentCandidateTeamIds_in !== undefined) {
            values.currentCandidateTeamIds_in = [...where.currentCandidateTeamIds_in];
        }
        if (where.currentStepType_in !== undefined) {
            values.currentStepType_in = [...where.currentStepType_in];
        }
        if (where.title_contains !== undefined) {
            values.title_contains = where.title_contains;
        }
        const requester: CmsEntryListWhereValues = {};
        if (where.requesterId !== undefined) {
            requester.id = where.requesterId;
        }
        if (where.requesterId_not !== undefined) {
            requester.id_not = where.requesterId_not;
        }
        if (Object.keys(requester).length > 0) {
            values.requester = requester;
        }

        const result = await this.listLatestEntries.execute<ReviewEntryValues>(model, {
            where: { values },
            // Values fields sort with the `values_` prefix (CMS sort mapper).
            sort: [`values_${params.sort}`],
            limit: params.limit,
            after: params.after ?? null
        });
        if (result.isFail()) {
            return Result.fail(new ReviewPersistenceError(result.error));
        }
        return Result.ok({
            items: result.value.entries.map(entry => ReviewEntryMapper.fromEntry(entry)),
            meta: result.value.meta
        });
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

    async delete(id: string): Promise<Result<void, ReviewPersistenceError>> {
        const model = await this.modelProvider.get();
        const result = await this.deleteEntry.execute(model, createIdentifier({ id, version: 1 }), {
            permanently: true
        });
        if (result.isFail() && result.error.code !== ENTRY_NOT_FOUND) {
            return Result.fail(new ReviewPersistenceError(result.error));
        }
        return Result.ok();
    }
}

export const ReviewRepository = Abstraction.createImplementation({
    implementation: ReviewRepositoryImpl,
    dependencies: [
        ReviewModelProvider,
        GetEntryByIdUseCase,
        ListLatestEntriesUseCase,
        CreateEntryUseCase,
        UpdateEntryUseCase,
        DeleteEntryUseCase
    ]
});
