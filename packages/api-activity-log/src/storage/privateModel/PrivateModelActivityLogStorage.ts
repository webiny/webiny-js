import { Result } from "@webiny/feature/api";
import { decodeCursor, encodeCursor } from "@webiny/utils";
import { CreateEntryUseCase } from "@webiny/api-headless-cms/features/contentEntry/CreateEntry/index.js";
import { DeleteEntryUseCase } from "@webiny/api-headless-cms/features/contentEntry/DeleteEntry/index.js";
import { ListLatestEntriesUseCase } from "@webiny/api-headless-cms/features/contentEntry/ListEntries/index.js";
import { CmsWhereMapper } from "@webiny/api-headless-cms/features/whereMapper/abstractions.js";
import type { CmsEntryListWhere, CmsModel } from "@webiny/api-headless-cms/types/index.js";
import { ActivityLogStorage } from "~/core/abstractions.js";
import { ActivityLogPersistenceError, ActivityLogReadError } from "~/core/errors.js";
import type { ActivityRecordInput, ActivityTarget } from "~/core/types.js";
import { ActivityLogModelProvider, type ActivityRecordValues } from "./abstractions.js";
import { entryToRecord, recordToValues, sequenceOf } from "./ActivityRecordMapper.js";

const DEFAULT_LIMIT = 50;

/**
 * Bounds one `deleteAllForTarget` call to 20 pages, so roughly a thousand records.
 *
 * Kept small deliberately. Each pass costs a full model read on the DynamoDB-only backend, and the
 * caller is a background task that has to regain control often enough to check its own timeout —
 * a chunk that runs for the whole Lambda budget would be killed mid-flight instead of continuing
 * cleanly. Finishing the job is the task's business, not this method's.
 */
const MAX_DELETE_PASSES = 20;

/**
 * Activity records stored one-per-entry in a private CMS model.
 *
 * This implementation is a knowingly-accepted stopgap and is expected to be replaced. Its read
 * path does not paginate at the database: on the DynamoDB-only backend, `list` loads every entry
 * in the model, transforms all of them, then filters and sorts in memory and slices the requested
 * page out of the result. Cost therefore tracks the size of the whole model rather than the size
 * of the page, and page position makes no difference at all.
 *
 * Nothing above `ActivityLogStorage` knows any of that, which is the point of the interface being
 * as narrow as it is.
 */
class PrivateModelActivityLogStorageImpl implements ActivityLogStorage.Interface {
    constructor(
        private modelProvider: ActivityLogModelProvider.Interface,
        private createEntry: CreateEntryUseCase.Interface,
        private listEntries: ListLatestEntriesUseCase.Interface,
        private deleteEntry: DeleteEntryUseCase.Interface,
        private whereMapper: CmsWhereMapper.Interface
    ) {}

    async append(record: ActivityRecordInput) {
        try {
            const model = await this.modelProvider.get();

            const result = await this.createEntry.execute<ActivityRecordValues>(model, {
                values: recordToValues(record)
            });

            if (result.isFail()) {
                return Result.fail(new ActivityLogPersistenceError(result.error));
            }

            return Result.ok(entryToRecord(result.value));
        } catch (error) {
            return Result.fail(new ActivityLogPersistenceError(error as Error));
        }
    }

    /**
     * Newest first, paged by keyset rather than by offset.
     *
     * The CMS cursor is not used, and is deliberately never allowed to cross the storage
     * interface. On the DynamoDB backend it is a base64-encoded *offset* and pagination is a
     * `slice(start, end)` over the sorted set, which is wrong twice over for this dataset:
     *
     *   - **It is unstable under append.** Records arrive newest-first and appending is the normal
     *     case, not an edge case. One record written between two page reads shifts every later
     *     record down by one, so page two re-shows the last row of page one. On an append-only log
     *     read newest-first, that is a duplicate on nearly every paged read.
     *   - **It is not portable.** An offset into a CMS result set means nothing to a different
     *     store, so passing it through would leave the interface clean while the data crossing it
     *     was not.
     *
     * So this adapter mints its own cursor: an opaque encoding of the last `sequence` it returned,
     * and the next page asks for records strictly below it. Callers treat it as a string; no
     * caller can read it, and a replacement store is free to define an entirely different format.
     */
    async list(params: ActivityLogStorage.ListParams) {
        try {
            const model = await this.modelProvider.get();
            const limit = params.limit ?? DEFAULT_LIMIT;

            const result = await this.listEntries.execute<ActivityRecordValues>(model, {
                where: this.buildWhere(params, model),
                // Model fields sort as `values_<fieldId>_<ORDER>`, not `<fieldId>_<ORDER>`:
                // `extractSort` only matches a bare name against *top-level* meta fields, and
                // throws "Sorting field does not exist in the content model" otherwise. The
                // separator is an underscore, not a dot.
                sort: ["values_sequence_DESC"],
                limit
            });

            if (result.isFail()) {
                return Result.fail(new ActivityLogReadError(result.error));
            }

            const { entries, meta } = result.value;
            const records = entries.map(entryToRecord);

            // `hasMoreItems` is computed against the filtered count, and the keyset filter has
            // already excluded everything the caller has seen, so it answers "is there another
            // page" correctly here. A cursor is returned only when there is, so a caller following
            // the cursor cannot page past the end — the DynamoDB backend emits one regardless,
            // which would otherwise mean a full model read per empty page, forever.
            const last = entries.at(-1);

            return Result.ok({
                records,
                cursor: meta.hasMoreItems && last ? encodeCursor(sequenceOf(last)) : null,
                hasMore: meta.hasMoreItems
            });
        } catch (error) {
            return Result.fail(new ActivityLogReadError(error as Error));
        }
    }

    async deleteAllForTarget(target: ActivityTarget) {
        try {
            const model = await this.modelProvider.get();
            let deleted = 0;

            // Each pass re-reads from the start rather than following a cursor, because deleting
            // the page just read shifts the offset that this backend's cursor encodes.
            //
            // That is the same shape as EmptyTrashBinTaskDefinition's loop, without the two things
            // wrong with it. A failed delete returns rather than being swallowed, so the loop
            // cannot spin on a record it will never remove. And the pass budget bounds the chunk
            // even if a backend keeps returning records it has reported as deleted, which
            // eventual consistency makes possible — reported as unfinished work rather than as
            // success, with the count of what was removed so the caller can tell progress from a
            // stall.
            for (let pass = 0; pass < MAX_DELETE_PASSES; pass++) {
                const page = await this.list({ target, limit: DEFAULT_LIMIT });

                if (page.isFail()) {
                    return Result.fail(new ActivityLogPersistenceError(page.error));
                }

                if (page.value.records.length === 0) {
                    return Result.ok({ finished: true, deleted });
                }

                for (const record of page.value.records) {
                    const outcome = await this.deleteEntry.execute(model, record.id, {
                        permanently: true
                    });

                    if (outcome.isFail()) {
                        // Already gone is the outcome we wanted, and is expected whenever a
                        // previous invocation stopped part-way through this target.
                        if (outcome.error.code !== "Cms/Entry/NotFound") {
                            return Result.fail(new ActivityLogPersistenceError(outcome.error));
                        }
                        continue;
                    }

                    deleted++;
                }
            }

            return Result.ok({ finished: false, deleted });
        } catch (error) {
            return Result.fail(new ActivityLogPersistenceError(error as Error));
        }
    }

    /**
     * Custom model fields are filtered under `where.values`, not at the top level, so the flat
     * filter goes through `CmsWhereMapper` with the model's own field list — the same route
     * record locking takes. Building the `where` by hand would put these keys at the top level,
     * where they would match nothing and fail silently rather than erroring.
     */
    private buildWhere(
        params: ActivityLogStorage.ListParams,
        model: CmsModel
    ): CmsEntryListWhere | undefined {
        const after = params.cursor ? decodeCursor(params.cursor) : null;

        return this.whereMapper.map({
            fields: model.fields,
            input: {
                targetType: params.target.type,
                targetId: params.target.id,
                ...(params.revision ? { revision: params.revision } : {}),
                ...(params.actorId ? { actorId: params.actorId } : {}),
                // Strictly below the last sequence returned, which is what makes paging stable
                // while records are being appended above it.
                ...(after ? { sequence_lt: after } : {})
            }
        });
    }
}

export const PrivateModelActivityLogStorage = ActivityLogStorage.createImplementation({
    implementation: PrivateModelActivityLogStorageImpl,
    dependencies: [
        ActivityLogModelProvider,
        CreateEntryUseCase,
        ListLatestEntriesUseCase,
        DeleteEntryUseCase,
        CmsWhereMapper
    ]
});
