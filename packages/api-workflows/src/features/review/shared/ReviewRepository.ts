import { Result } from "@webiny/feature/api";
import { createIdentifier, parseIdentifier } from "@webiny/utils";
import type {
    CmsEntryListWhere,
    CmsEntryListWhereValues
} from "@webiny/api-headless-cms/types/index.js";
import { CreateEntryUseCase } from "@webiny/api-headless-cms/features/contentEntry/CreateEntry/index.js";
import { DeleteEntryUseCase } from "@webiny/api-headless-cms/features/contentEntry/DeleteEntry/index.js";
import { UpdateEntryUseCase } from "@webiny/api-headless-cms/features/contentEntry/UpdateEntry/index.js";
import { GetEntryByIdUseCase } from "@webiny/api-headless-cms/features/contentEntry/GetEntryById/index.js";
import { GetEntriesByIdsUseCase } from "@webiny/api-headless-cms/features/contentEntry/GetEntriesByIds/index.js";
import { ListLatestEntriesUseCase } from "@webiny/api-headless-cms/features/contentEntry/ListEntries/index.js";
import { GetUniqueFieldValuesUseCase } from "@webiny/api-headless-cms/features/contentEntry/GetUniqueFieldValues/index.js";
import { ReviewModelProvider } from "~/domain/review/abstractions/ReviewModelProvider.js";
import { ReviewRepository as Abstraction } from "~/domain/review/abstractions/ReviewRepository.js";
import { ReviewNotFoundError, ReviewPersistenceError } from "~/domain/review/errors.js";
import type { ReviewData, ReviewListReadFilter } from "~/domain/review/types.js";
import { ReviewEntryMapper, type ReviewEntryValues } from "./ReviewEntryMapper.js";

const ENTRY_NOT_FOUND = "Cms/Entry/NotFound";
/** At most one review per revision is active (D23); a few extra hits cover stale list results. */
const ACTIVE_BY_TARGET_LIMIT = 10;
const COUNT_PAGE_SIZE = 100;
/** Target ids per `targetId_in` query; keeps each query's terms list small. */
const TARGET_IDS_PER_QUERY = 100;

/** Keeps a confirmed primary row: the listed condition still holds on it (R18). */
type ConfirmedReviewFilter = (review: ReviewData) => boolean;

/** Splits ids into chunks of `size`, in order. Pure. */
const toChunks = (ids: string[], size: number): string[][] => {
    const chunks: string[][] = [];
    for (let index = 0; index < ids.length; index += size) {
        chunks.push(ids.slice(index, index + size));
    }
    return chunks;
};

/**
 * Adds the read filter of a list to its CMS where (Q77): readable namespaces with `model_in`,
 * own-only namespaces with `model_in` and the target author, the two as an `OR` when the viewer has
 * both kinds, and denied folders with `targetContext.folder.id_not_in`. A review in the root folder
 * has no folder id, which `not_in` never excludes. Changes `where` and its `values`.
 */
const applyReadFilter = (where: CmsEntryListWhere, read: ReviewListReadFilter): void => {
    const values: CmsEntryListWhereValues = where.values ?? {};
    where.values = values;
    const ownOnlyModels = read.ownOnlyModels.filter(model => !read.models.includes(model));
    const targetContext: CmsEntryListWhereValues = {};

    if (read.models.length > 0 && ownOnlyModels.length > 0) {
        where.OR = [
            { values: { model_in: [...read.models] } },
            {
                values: {
                    model_in: ownOnlyModels,
                    targetContext: { author: { id: read.authorId } }
                }
            }
        ];
    } else if (read.models.length > 0) {
        values.model_in = [...read.models];
    } else {
        values.model_in = ownOnlyModels;
        targetContext.author = { id: read.authorId };
    }

    if (read.deniedFolderIds.length > 0) {
        targetContext.folder = { id_not_in: [...read.deniedFolderIds] };
    }
    if (Object.keys(targetContext).length > 0) {
        values.targetContext = targetContext;
    }
};

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
        private getEntriesByIds: GetEntriesByIdsUseCase.Interface,
        private listLatestEntries: ListLatestEntriesUseCase.Interface,
        private createEntry: CreateEntryUseCase.Interface,
        private updateEntry: UpdateEntryUseCase.Interface,
        private deleteEntry: DeleteEntryUseCase.Interface,
        private getUniqueFieldValues: GetUniqueFieldValuesUseCase.Interface
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

    async getMany(ids: string[]): Promise<Result<ReviewData[], ReviewPersistenceError>> {
        const uniqueIds = [...new Set(ids)];
        if (uniqueIds.length === 0) {
            return Result.ok([]);
        }
        const model = await this.modelProvider.get();
        // A review is stored as revision 1 only, so a review id maps to one revision id.
        const revisionIds = uniqueIds.map(id => createIdentifier({ id, version: 1 }));
        const result = await this.getEntriesByIds.execute<ReviewEntryValues>(model, revisionIds);
        if (result.isFail()) {
            return Result.fail(new ReviewPersistenceError(result.error));
        }

        const byId = new Map<string, ReviewData>();
        for (const entry of result.value) {
            const review = ReviewEntryMapper.fromEntry(entry);
            byId.set(review.id, review);
        }
        // Storage returns the entries in no particular order; keep the order of `ids`.
        const reviews: ReviewData[] = [];
        for (const id of uniqueIds) {
            const review = byId.get(id);
            if (review) {
                reviews.push(review);
            }
        }
        return Result.ok(reviews);
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

        // Primary-storage rows of the listed hits, in list order; a hit deleted since is left out.
        const listedIds = result.value.entries.map(entry => parseIdentifier(entry.id).id);
        const primary = await this.getMany(listedIds);
        if (primary.isFail()) {
            return Result.fail(primary.error);
        }
        const active = primary.value.find(review => {
            return (
                review.isActive &&
                review.model === params.model &&
                review.targetRevisionId === params.targetRevisionId
            );
        });
        return Result.ok(active ?? null);
    }

    async listReviewedModels(): Promise<Result<string[], ReviewPersistenceError>> {
        const model = await this.modelProvider.get();
        const result = await this.getUniqueFieldValues.execute(model, {
            // Active reviews only: the review lists return nothing else (`createReviewListWhere`
            // sets `isActive: true`). The folder rules cover only these models, so if the lists
            // ever return inactive reviews, this set must include them too.
            where: { latest: true, values: { isActive: true } },
            fieldId: "model"
        });
        if (result.isFail()) {
            return Result.fail(new ReviewPersistenceError(result.error));
        }
        const models = result.value.map(item => item.value).filter(Boolean);
        return Result.ok(models);
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
        // One batch read per page confirms the listed rows (R18, Q78).
        return this.listConfirmed({ workflowId, state: "inProgress" }, review => {
            return review.workflowId === workflowId && review.state === "inProgress";
        });
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
        const values: CmsEntryListWhereValues = {
            model: params.model,
            targetId: params.targetId
        };
        if (params.targetRevisionId) {
            values.targetRevisionId = params.targetRevisionId;
        }
        return this.listConfirmed(values, review => {
            return (
                review.model === params.model &&
                review.targetId === params.targetId &&
                (!params.targetRevisionId || review.targetRevisionId === params.targetRevisionId)
            );
        });
    }

    async listByTargets(
        params: Abstraction.ByTargetsParams
    ): Promise<Result<ReviewData[], ReviewPersistenceError>> {
        const targetIds = [...new Set(params.targetIds)];
        const reviews: ReviewData[] = [];
        // One query per chunk: a fixed number of queries for any number of targets.
        for (const chunk of toChunks(targetIds, TARGET_IDS_PER_QUERY)) {
            const values: CmsEntryListWhereValues = {
                model: params.model,
                targetId_in: chunk
            };
            const listed = await this.listConfirmed(values, review => {
                return review.model === params.model && chunk.includes(review.targetId);
            });
            if (listed.isFail()) {
                return Result.fail(listed.error);
            }
            reviews.push(...listed.value);
        }
        return Result.ok(reviews);
    }

    /**
     * Every listed review matching `values`, page by page, each page confirmed with one batch read
     * of primary storage (R18, Q78). `keep` checks the listed condition again on the primary row.
     */
    private async listConfirmed(
        values: CmsEntryListWhereValues,
        keep: ConfirmedReviewFilter
    ): Promise<Result<ReviewData[], ReviewPersistenceError>> {
        const model = await this.modelProvider.get();
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

            const listedIds = result.value.entries.map(entry => parseIdentifier(entry.id).id);
            const primary = await this.getMany(listedIds);
            if (primary.isFail()) {
                return Result.fail(primary.error);
            }
            reviews.push(...primary.value.filter(keep));

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
            (where.read.models.length === 0 && where.read.ownOnlyModels.length === 0) ||
            where.currentCandidateTeamIds_in?.length === 0 ||
            where.currentStepType_in?.length === 0;
        if (emptyIn) {
            return Result.ok({
                items: [],
                meta: { cursor: null, hasMoreItems: false, totalCount: 0 }
            });
        }

        const model = await this.modelProvider.get();
        const values: CmsEntryListWhereValues = {};
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
        if (where.lastChangedOn_gte !== undefined) {
            values.lastChangedOn_gte = where.lastChangedOn_gte;
        }
        if (where.lastChangedOn_lte !== undefined) {
            values.lastChangedOn_lte = where.lastChangedOn_lte;
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

        const listWhere: CmsEntryListWhere = { values };
        applyReadFilter(listWhere, where.read);
        // An empty list would match nothing on some storages: leave the filter out.
        if (where.id_not_in?.length) {
            listWhere.entryId_not_in = [...where.id_not_in];
        }

        const result = await this.listLatestEntries.execute<ReviewEntryValues>(model, {
            where: listWhere,
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

    async create(review: ReviewData): Promise<Result<ReviewData, ReviewPersistenceError>> {
        const model = await this.modelProvider.get();
        const created = await this.createEntry.execute<ReviewEntryValues>(model, {
            id: review.id,
            // The aggregate's `now`, so `createdOn` matches the `requested` fact (A5).
            createdOn: review.createdOn,
            values: ReviewEntryMapper.toValues(review)
        });
        if (created.isFail()) {
            return Result.fail(new ReviewPersistenceError(created.error));
        }
        return Result.ok(ReviewEntryMapper.fromEntry(created.value));
    }

    async update(
        review: ReviewData
    ): Promise<Result<ReviewData, ReviewNotFoundError | ReviewPersistenceError>> {
        const model = await this.modelProvider.get();
        const id = createIdentifier({ id: review.id, version: 1 });
        const updated = await this.updateEntry.execute<ReviewEntryValues>(model, id, {
            values: ReviewEntryMapper.toValues(review)
        });
        if (updated.isFail()) {
            if (updated.error.code === ENTRY_NOT_FOUND) {
                return Result.fail(new ReviewNotFoundError({ id: review.id }));
            }
            return Result.fail(new ReviewPersistenceError(updated.error));
        }
        return Result.ok(ReviewEntryMapper.fromEntry(updated.value));
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
        GetEntriesByIdsUseCase,
        ListLatestEntriesUseCase,
        CreateEntryUseCase,
        UpdateEntryUseCase,
        DeleteEntryUseCase,
        GetUniqueFieldValuesUseCase
    ]
});
