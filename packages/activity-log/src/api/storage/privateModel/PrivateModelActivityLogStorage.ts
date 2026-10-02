import { Result } from "@webiny/feature/api";
import { decodeCursor, encodeCursor } from "@webiny/utils";
import { CreateEntryUseCase } from "@webiny/api-headless-cms/features/contentEntry/CreateEntry/index.js";
import { DeleteEntryUseCase } from "@webiny/api-headless-cms/features/contentEntry/DeleteEntry/index.js";
import { UpdateEntryUseCase } from "@webiny/api-headless-cms/features/contentEntry/UpdateEntry/index.js";
import { GetEntryByIdUseCase } from "@webiny/api-headless-cms/features/contentEntry/GetEntryById/index.js";
import { ListLatestEntriesUseCase } from "@webiny/api-headless-cms/features/contentEntry/ListEntries/index.js";
import { CmsWhereMapper } from "@webiny/api-headless-cms/features/whereMapper/abstractions.js";
import type { CmsEntryListWhere, CmsModel } from "@webiny/api-headless-cms/types/index.js";
import { ActivityLogStorage } from "~/api/core/abstractions.js";
import { ActivityLogPersistenceError, ActivityLogReadError } from "~/api/core/errors.js";
import type { ActivityRecord, ActivityRecordInput, ActivityTarget } from "~/api/core/types.js";
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
 * Bounds one `findStaleValues` call, for the same reason as `MAX_DELETE_PASSES`: every pass costs a
 * full model read on the DynamoDB-only backend, and the caller is a scheduled task that has to
 * regain control often enough to check its own timeout.
 */
const MAX_SCAN_PASSES = 20;
const SCAN_PAGE_SIZE = 100;

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
        private updateEntry: UpdateEntryUseCase.Interface,
        private getEntry: GetEntryByIdUseCase.Interface,
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
    /**
     * Writes the summary and clears the values in one update.
     *
     * Only the summary fields are sent. `UpdateEntryUseCase` merges into the stored values, so
     * `sequence` is untouched and the record keeps its place under the keyset cursor — which is the
     * property the conformance suite pins, because an update that reordered would make a reader
     * skip or repeat rows mid-page.
     *
     * A missing record is success, not failure. The entry may have been purged while the job ran,
     * and the correct response to "the thing you were summarising is gone" is to stop, not to
     * retry forever or to recreate history that was deliberately deleted.
     *
     * Idempotent by construction: a second run writes the same summary and clears values that are
     * already clear.
     */
    async settleSummary(params: ActivityLogStorage.SettleSummaryParams) {
        try {
            const model = await this.modelProvider.get();

            const result = await this.updateEntry.execute<Partial<ActivityRecordValues>>(
                model,
                params.recordId,
                {
                    values: {
                        summary: params.summary ?? null,
                        summaryKind: params.kind ?? null,
                        summaryReason: params.reason ?? null,
                        // Omitted leaves membership alone; `null` detaches, which is what a
                        // refused join needs and what the job settling a summary must not do.
                        ...(params.runId === undefined ? {} : { summaryRunId: params.runId }),
                        // The obligation. Everything else on this write is bookkeeping; this is
                        // the part that stops content values outliving the job.
                        summaryValues: null,
                        summaryValuesWrittenOn: null,
                        summaryTaskId: null
                    }
                },
                // The record is append-only in everything a reader sees, so it carries no draft
                // state a validation pass would have anything to say about. Skipping it also keeps
                // this write cheap, which matters because the sweeper performs it in bulk.
                { skipValidation: true }
            );

            if (result.isFail()) {
                // A purged entry is the expected race, not an error. Anything else is real.
                if (result.error.code === "Cms/Entry/NotFound") {
                    return Result.ok();
                }

                return Result.fail(new ActivityLogPersistenceError(result.error));
            }

            return Result.ok();
        } catch (error) {
            return Result.fail(new ActivityLogPersistenceError(error as Error));
        }
    }
    /**
     * Replaces a pending record's bundle so a run of saves shares one job.
     *
     * Reads before writing, which the other two operations do not need to, because this one has a
     * precondition: a record whose summary has already settled must be left alone. A job that
     * finished while a later save was extending would otherwise have its sentence overwritten by
     * values nothing is coming to consume — content left on a record with no job for it, which is
     * the exact state the sweeper exists to prevent and should not be routinely creating.
     *
     * The read costs one entry fetch per debounced save. That is the price of the debounce, and it
     * is still far cheaper than the dispatch it avoids.
     */
    async extendSummaryValues(params: ActivityLogStorage.ExtendValuesParams) {
        try {
            const model = await this.modelProvider.get();

            const existing = await this.getEntry.execute<ActivityRecordValues>(
                model,
                params.recordId
            );

            if (existing.isFail()) {
                // Gone, or never existed — purged while the run was still going. Not an error, but
                // the caller has to know it did not join.
                return Result.ok({ extended: false });
            }

            if (existing.value.values.summary) {
                // Already settled. Refusing is the point of the read.
                return Result.ok({ extended: false });
            }

            const result = await this.updateEntry.execute<Partial<ActivityRecordValues>>(
                model,
                params.recordId,
                { values: { summaryValues: params.values } },
                { skipValidation: true }
            );

            if (result.isFail()) {
                if (result.error.code === "Cms/Entry/NotFound") {
                    return Result.ok({ extended: false });
                }

                return Result.fail(new ActivityLogPersistenceError(result.error));
            }

            return Result.ok({ extended: true });
        } catch (error) {
            return Result.fail(new ActivityLogPersistenceError(error as Error));
        }
    }

    /**
     * Records still holding transient values written before a given instant.
     *
     * The age test is applied here rather than in the query, and that is deliberate. A
     * `summaryValuesWrittenOn_lt` filter also matches records where the field is unset — which is
     * almost every record — so the query came back full of rows with nothing to sweep. Backend
     * null-ordering is not something to rely on, and the conformance suite caught it.
     *
     * So this scans pages in insertion order and filters in memory, stopping once it has filled the
     * caller's limit or run out of passes. An empty result therefore means "nothing stale within
     * the scan bound", which is what lets the sweeper treat it as done. Filtering *after* applying
     * the caller's limit would not: a page of records that all lack values would look like an
     * empty sweep while stale records sat behind it.
     *
     * This is the most expensive operation in the feature and the one query the current storage
     * does badly: there is no index on the values timestamp, so on the DynamoDB-only backend each
     * pass inherits the whole-model read. Acceptable only because the sweeper runs on a schedule
     * rather than in a request. **This is the query worth improving in the replacement storage
     * layer.**
     */
    async findStaleValues(params: ActivityLogStorage.StaleValuesParams) {
        try {
            const model = await this.modelProvider.get();
            const limit = params.limit ?? DEFAULT_LIMIT;
            const stale: ActivityRecord[] = [];

            // Resumed from the caller's cursor, not from the start. Restarting every call would
            // rescan the same oldest pages forever: settled records stay where they are, so on a
            // model larger than one call's reach, nothing past that reach would ever be seen.
            // An unreadable cursor decodes to null and the scan starts over. Costly rather than
            // wrong: a sweep never loses records by beginning again, only by skipping ahead.
            const resumeFrom = params.after ? decodeCursor(params.after) : null;
            let after: string | null = typeof resumeFrom === "string" ? resumeFrom : null;
            let reachedEnd = false;
            let filledBatch = false;

            for (let pass = 0; pass < MAX_SCAN_PASSES && stale.length < limit; pass++) {
                const result = await this.listEntries.execute<ActivityRecordValues>(model, {
                    where: this.whereMapper.map({
                        fields: model.fields,
                        input: after ? { sequence_gt: after } : {}
                    }),
                    sort: ["values_sequence_ASC"],
                    limit: SCAN_PAGE_SIZE
                });

                if (result.isFail()) {
                    return Result.fail(new ActivityLogReadError(result.error));
                }

                const { entries } = result.value;

                if (entries.length === 0) {
                    reachedEnd = true;
                    break;
                }

                for (const entry of entries) {
                    // Advanced per entry, not per page. A batch that fills mid-page must resume at
                    // the record it stopped on, or the rest of that page is skipped silently.
                    after = sequenceOf(entry);

                    const record = entryToRecord(entry);
                    const writtenOn = record.summaryState?.valuesWrittenOn;

                    if (
                        record.summaryState?.values?.length &&
                        writtenOn &&
                        writtenOn < params.writtenBefore
                    ) {
                        stale.push(record);

                        if (stale.length >= limit) {
                            filledBatch = true;
                            break;
                        }
                    }
                }

                if (filledBatch) {
                    break;
                }

                if (entries.length < SCAN_PAGE_SIZE) {
                    reachedEnd = true;
                    break;
                }
            }

            // A null cursor is the only claim that the whole model has been seen, so it is made
            // only where the data actually ran out — not when this call merely hit its own bound
            // and not when it simply filled the batch it was asked for.
            return Result.ok({
                records: stale,
                cursor: reachedEnd || after === null ? null : encodeCursor(after)
            });
        } catch (error) {
            return Result.fail(new ActivityLogReadError(error as Error));
        }
    }

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
        UpdateEntryUseCase,
        GetEntryByIdUseCase,
        CmsWhereMapper
    ]
});
