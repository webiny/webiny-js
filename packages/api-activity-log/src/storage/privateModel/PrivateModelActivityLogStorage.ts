import { Result } from "@webiny/feature/api";
import { CreateEntryUseCase } from "@webiny/api-headless-cms/features/contentEntry/CreateEntry/index.js";
import { DeleteEntryUseCase } from "@webiny/api-headless-cms/features/contentEntry/DeleteEntry/index.js";
import { ListLatestEntriesUseCase } from "@webiny/api-headless-cms/features/contentEntry/ListEntries/index.js";
import { CmsWhereMapper } from "@webiny/api-headless-cms/features/whereMapper/abstractions.js";
import type { CmsEntryListWhere, CmsModel } from "@webiny/api-headless-cms/types/index.js";
import { ActivityLogStorage } from "~/core/abstractions.js";
import { ActivityLogPersistenceError, ActivityLogReadError } from "~/core/errors.js";
import type { ActivityRecordInput, ActivityTarget } from "~/core/types.js";
import { ActivityLogModelProvider, type ActivityRecordValues } from "./abstractions.js";
import { entryToRecord, recordToValues } from "./ActivityRecordMapper.js";

const DEFAULT_LIMIT = 50;

/**
 * Bounds `deleteAllForTarget`. At 50 records a pass this clears 10,000 records per invocation,
 * comfortably more than a single entry accumulates, while still terminating if a backend keeps
 * returning records it has reported as deleted.
 */
const MAX_DELETE_PASSES = 200;

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

    async list(params: ActivityLogStorage.ListParams) {
        try {
            const model = await this.modelProvider.get();

            const result = await this.listEntries.execute<ActivityRecordValues>(model, {
                where: this.buildWhere(params, model),
                sort: ["timestamp_DESC"],
                limit: params.limit ?? DEFAULT_LIMIT,
                after: params.cursor ?? undefined
            });

            if (result.isFail()) {
                return Result.fail(new ActivityLogReadError(result.error));
            }

            const { entries, meta } = result.value;

            return Result.ok({
                records: entries.map(entryToRecord),
                // The DynamoDB-only backend emits a cursor unconditionally, even once the result
                // set is exhausted, so `hasMoreItems` is the only trustworthy signal. Handing back
                // a cursor without it would let a caller page forever past the end, paying a full
                // model read for each empty page.
                cursor: meta.hasMoreItems ? meta.cursor : null,
                hasMore: meta.hasMoreItems
            });
        } catch (error) {
            return Result.fail(new ActivityLogReadError(error as Error));
        }
    }

    async deleteAllForTarget(target: ActivityTarget) {
        try {
            const model = await this.modelProvider.get();

            // Each pass re-reads from the start rather than following a cursor, because deleting
            // the page just read shifts the offset that this backend's cursor encodes.
            //
            // That is the same shape as EmptyTrashBinTaskDefinition's loop, minus the two things
            // wrong with it. A failed delete returns instead of being swallowed, so the loop
            // cannot spin on a record it will never remove; and the pass budget bounds it even if
            // a backend reports a record as deleted while still returning it, which eventual
            // consistency makes possible. Running out of passes is reported as unfinished work,
            // not as success, so the caller comes back for the rest.
            for (let pass = 0; pass < MAX_DELETE_PASSES; pass++) {
                const page = await this.list({ target, limit: DEFAULT_LIMIT });

                if (page.isFail()) {
                    return Result.fail(new ActivityLogPersistenceError(page.error));
                }

                if (page.value.records.length === 0) {
                    return Result.ok();
                }

                for (const record of page.value.records) {
                    const deleted = await this.deleteEntry.execute(model, record.id, {
                        permanently: true
                    });

                    // Already gone is the outcome we wanted, and is expected whenever a previous
                    // invocation stopped part-way through this target.
                    if (deleted.isFail() && deleted.error.code !== "Cms/Entry/NotFound") {
                        return Result.fail(new ActivityLogPersistenceError(deleted.error));
                    }
                }
            }

            return Result.fail(
                new ActivityLogPersistenceError(
                    new Error(
                        `Did not finish deleting activity records for ${target.type} "${target.id}" ` +
                            `within ${MAX_DELETE_PASSES} passes. Records remain; invoke again to continue.`
                    )
                )
            );
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
        return this.whereMapper.map({
            fields: model.fields,
            input: {
                targetType: params.target.type,
                targetId: params.target.id,
                ...(params.revision ? { revision: params.revision } : {}),
                ...(params.actorId ? { actorId: params.actorId } : {})
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
