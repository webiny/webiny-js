import WebinyError from "@webiny/error";
import type {
    CmsEntry,
    CmsEntryListWhere,
    CmsEntryStorageOperationsGetUniqueFieldValuesParams,
    CmsEntryStorageOperationsListParams,
    CmsEntryStorageOperationsListResponse,
    CmsEntryUniqueValue,
    CmsEntryValues,
    CmsModel,
    CmsStorageEntry
} from "@webiny/api-headless-cms/types/index.js";
import { KnexClient } from "@webiny/api-core-sql";
import { StorageTransformRegistry } from "@webiny/api-headless-cms/exports/api/cms/storage.js";
import { CmsStorageModelProvider } from "@webiny/api-headless-cms/features/shared/abstractions.js";
import { ValueFilterRegistry } from "@webiny/db-utils";
import {
    aggregateUniqueFieldValues,
    createStorageTransformCallable,
    FieldFilterCreateRegistry,
    FieldFilterPathRegistry,
    FieldFilterValueTransformRegistry,
    FieldSortingRegistry
} from "@webiny/api-headless-cms-storage";
import { EntrySearch as Abstraction } from "./abstractions.js";
import { PgSchema } from "~/features/schema/abstractions.js";
import { PgStorageConfig } from "~/features/config/abstractions.js";
import { ScopeRegistry } from "~/features/scopes/abstractions.js";
import { listRevisionsOfEntry } from "~/features/entries/listRevisionsOfEntry.js";
import { compileWhere } from "./compileWhere.js";
import { compileSearch } from "./compileSearch.js";
import { compileSort } from "./compileSort.js";
import { readListPage } from "./readListPage.js";
import type { ICursor } from "./compilePage.js";
import { SqlFragment } from "./SqlFragment.js";
import { getView } from "./views.js";
import { readsIx } from "~/features/indexMode/indexMode.js";
import { createNullToken } from "./tokens.js";
import { readValueCounts } from "./valueCounts.js";
import { rowToEntry } from "~/features/entries/entryRow.js";
import { modelRows, whereTextIn } from "~/features/entries/entryQueries.js";

const MAX_LIST_LIMIT = 1000000;
/* Entries read per query when loading a list page. */
const LOAD_ENTRIES_CHUNK = 5000;

/* UTF-8 base64 of {v, id}; the shared cursor helpers decode as ASCII and mangle non-ASCII sort values. */
const encodeCursor = (cursor: ICursor): string =>
    Buffer.from(JSON.stringify(cursor), "utf8").toString("base64");

const parseCursor = (after: string | null | undefined): ICursor | null => {
    if (!after) {
        return null;
    }
    try {
        const parsed = JSON.parse(Buffer.from(after, "base64").toString("utf8"));
        if (parsed && typeof parsed.id === "string") {
            return parsed;
        }
    } catch {
        // Not a pg cursor (e.g. one issued by another storage); start from the beginning.
    }
    return null;
};

class EntrySearchImpl implements Abstraction.Interface {
    public constructor(
        private readonly knex: KnexClient.Interface,
        private readonly schema: PgSchema.Interface,
        private readonly scopes: ScopeRegistry.Interface,
        private readonly storageTransformRegistry: StorageTransformRegistry.Interface,
        private readonly storageModelProvider: CmsStorageModelProvider.Interface,
        private readonly pathRegistry: FieldFilterPathRegistry.Interface,
        private readonly transformRegistry: FieldFilterValueTransformRegistry.Interface,
        private readonly filterCreateRegistry: FieldFilterCreateRegistry.Interface,
        private readonly sortingRegistry: FieldSortingRegistry.Interface,
        private readonly valueFilterRegistry: ValueFilterRegistry.Interface,
        private readonly config: PgStorageConfig.Interface
    ) {}

    public async list<T extends CmsEntryValues = CmsEntryValues>(
        initialModel: CmsModel,
        params: CmsEntryStorageOperationsListParams
    ): Promise<CmsEntryStorageOperationsListResponse<CmsEntry<T>>> {
        const model = this.storageModelProvider.getModel(initialModel);
        const where: Partial<CmsEntryListWhere> = { ...params.where };

        // Same contract as the SQL storage: an entryId without latest/published lists all revisions.
        if (where.entryId && where.published !== true && where.latest !== true) {
            return listRevisionsOfEntry<T>({
                knex: this.knex.client,
                tables: this.schema.getTables(),
                model,
                params,
                storageTransformRegistry: this.storageTransformRegistry,
                pathRegistry: this.pathRegistry,
                transformRegistry: this.transformRegistry,
                filterCreateRegistry: this.filterCreateRegistry,
                sortingRegistry: this.sortingRegistry,
                valueFilterRegistry: this.valueFilterRegistry
            });
        }

        const view = getView(where.published === true, where.wbyDeleted === true);
        delete where.published;
        delete where.latest;
        if (where.wbyDeleted !== true && where.wbyDeleted_not === true) {
            // Binned entries have their own views, so this view holds none; the API adds it to every list.
            delete where.wbyDeleted_not;
        }
        delete where.wbyDeleted;

        const scope = await this.getScope(model);
        const { search, entries } = this.schema.getTables();

        const whereCondition = compileWhere({
            scope,
            where,
            filterCreateRegistry: this.filterCreateRegistry,
            transformRegistry: this.transformRegistry,
            valueFilterRegistry: this.valueFilterRegistry
        });
        const base: SqlFragment[] = [
            new SqlFragment("scope_id = ?", [scope.scopeId]),
            new SqlFragment("view = ?", [view]),
            // Every search index is partial on `ix`; only an indexed scope has all its rows flagged.
            new SqlFragment(readsIx(scope.indexMode) ? "ix" : "TRUE")
        ];
        const conditions: SqlFragment[] = whereCondition.sql === "TRUE" ? [] : [whereCondition];
        const searchCondition = compileSearch(scope, params.search, params.fields);
        if (searchCondition) {
            conditions.push(searchCondition);
        }
        const sort = compileSort(model, scope, params.sort, this.sortingRegistry);
        const cursor = parseCursor(params.after);

        const limit =
            params.limit <= 0 || params.limit >= MAX_LIST_LIMIT ? MAX_LIST_LIMIT : params.limit;
        // NULL rows are found by their null token only once every row has it: a slot still
        // "filling" (or "reindex") sorts by reading the scope's rows, like a lean scope.
        const sortReady =
            !!sort.slot &&
            !Object.keys(scope.slotMap.state || {}).some(
                path => scope.slotMap.slots[path] === sort.slot
            );
        const nullToken =
            sort.slot && sortReady && readsIx(scope.indexMode)
                ? createNullToken(scope.scopeId, sort.slot)
                : null;
        const { totalCount, rows } = await readListPage({
            db: this.knex.client,
            search,
            base,
            conditions,
            sort,
            cursor,
            limit: limit + 1,
            nullToken,
            cap: this.config.countCap,
            bitmapHints: this.config.bitmapHints,
            estimateTtlMs: this.config.estimateTtlMs
        });
        const hasMoreItems = rows.length > limit;
        const page = rows.slice(0, limit);

        const items = await this.loadEntries<T>(
            model,
            entries,
            page.map(row => row.id)
        );
        const last = page[page.length - 1];
        const nextCursor = last ? encodeCursor({ v: last.sort_value, id: last.entry_id }) : null;

        return {
            hasMoreItems,
            totalCount,
            cursor: nextCursor || null,
            items
        };
    }

    public async uniqueValues(
        model: CmsModel,
        params: CmsEntryStorageOperationsGetUniqueFieldValuesParams
    ) {
        const field = model.fields.find(f => f.fieldId === params.fieldId);
        if (!field) {
            return [];
        }
        const where: Partial<CmsEntryListWhere> = { ...params.where };
        const view = getView(where.published === true, where.wbyDeleted === true);
        delete where.published;
        delete where.latest;
        if (where.wbyDeleted !== true && where.wbyDeleted_not === true) {
            // Binned entries have their own views, so this view holds none; the API adds it to every list.
            delete where.wbyDeleted_not;
        }
        delete where.wbyDeleted;

        const scope = await this.getScope(model);
        const { search, entries } = this.schema.getTables();
        const filter = SqlFragment.join(
            [
                new SqlFragment("s.scope_id = ?", [scope.scopeId]),
                new SqlFragment("s.view = ?", [view]),
                new SqlFragment(readsIx(scope.indexMode) ? "s.ix" : "TRUE"),
                compileWhere({
                    scope,
                    where,
                    filterCreateRegistry: this.filterCreateRegistry,
                    transformRegistry: this.transformRegistry,
                    valueFilterRegistry: this.valueFilterRegistry
                })
            ],
            " AND "
        );
        const path = `values.${field.fieldId}`;
        const slot = scope.slotMap.slots[path];
        const family = scope.plan.paths[path]?.family;
        const filtered = Object.values(where).some(value => value !== undefined);
        if (readsIx(scope.indexMode) && slot && family === "ta" && !filtered) {
            // Every value of a text list: maintained counts, no rows read.
            const { values, valueDeltas } = this.schema.getTables();
            return readValueCounts({
                db: this.knex.client,
                values,
                valueDeltas,
                scopeId: scope.scopeId,
                view,
                slot
            });
        }
        if (readsIx(scope.indexMode) && slot && (family === "t" || family === "ta")) {
            return this.uniqueSlotValues(search, slot, family === "ta", filter);
        }
        // Reads only the one field's value of each matching entry.
        const result = await this.knex.client.raw(
            `SELECT e.data->'values'->? AS value FROM "${search}" s
             JOIN "${entries}" e ON e.tenant = ? AND e.model_id = ? AND e.id = s.id
             WHERE ${filter.sql}`,
            new SqlFragment("", [field.storageId, model.tenant, model.modelId]).rawBindings(
                ...filter.bindings
            )
        );
        const items = result.rows.map((row: { value: unknown }) => ({
            values: { [field.fieldId]: row.value }
        }));
        return aggregateUniqueFieldValues(items as CmsEntry[], field.fieldId);
    }

    /*
     * Unique values of a text field kept in a slot column, counted in Postgres from the search rows:
     * no entry rows are read. Unfiltered, the slot's index holds every value (an index-only scan).
     * The slot holds the field's values as strings, empty ones left out, as aggregateUniqueFieldValues
     * counts them (the entries holding a value: repeated in one entry, it counts once).
     */
    private async uniqueSlotValues(
        search: string,
        slot: string,
        isList: boolean,
        filter: SqlFragment
    ): Promise<CmsEntryUniqueValue[]> {
        const value = isList ? "v" : `s.${slot}`;
        const from = isList
            ? `"${search}" s CROSS JOIN LATERAL (SELECT DISTINCT u FROM unnest(s.${slot}) u) d(v)`
            : `"${search}" s`;
        const result = await this.knex.client.raw(
            `SELECT ${value} AS value, count(*)::int AS count FROM ${from}
             WHERE ${filter.sql} AND s.${slot} IS NOT NULL
             GROUP BY 1`,
            filter.rawBindings()
        );
        return (result.rows as CmsEntryUniqueValue[])
            .sort((a, b) => (a.value > b.value ? 1 : b.value > a.value ? -1 : 0))
            .sort((a, b) => b.count - a.count);
    }

    /* Reads never rebuild rows: pending work on a model's keys is done by ModelStorageSync. */
    private async getScope(model: CmsModel) {
        return this.scopes.get(model);
    }

    private async loadEntries<T extends CmsEntryValues>(
        model: ReturnType<CmsStorageModelProvider.Interface["getModel"]>,
        entries: string,
        ids: string[]
    ): Promise<CmsEntry<T>[]> {
        if (ids.length === 0) {
            return [];
        }
        // A page can be up to MAX_LIST_LIMIT rows: read it in bounded chunks, each with the ids as
        // one array parameter.
        const byId = new Map<string, { id: string; data: CmsStorageEntry }>();
        for (let start = 0; start < ids.length; start += LOAD_ENTRIES_CHUNK) {
            const rows: { id: string; data: CmsStorageEntry }[] = await whereTextIn(
                modelRows(this.knex.client, entries, model).select("id", "data"),
                "id",
                ids.slice(start, start + LOAD_ENTRIES_CHUNK)
            );
            for (const row of rows) {
                byId.set(row.id, row);
            }
        }
        const fromStorage = createStorageTransformCallable(this.storageTransformRegistry, model);

        const items: CmsEntry<T>[] = [];
        for (const id of ids) {
            const row = byId.get(id);
            if (!row) {
                throw new WebinyError(
                    `Search row points to a missing entry "${id}".`,
                    "PG_INDEX_DRIFT",
                    { id }
                );
            }
            const entry = rowToEntry<T>(row, model);
            for (const field of model.fields) {
                (entry.values as Record<string, unknown>)[field.fieldId] = await fromStorage(
                    field,
                    entry.values[field.fieldId]
                );
            }
            items.push(entry);
        }
        return items;
    }
}

export const EntrySearchImplementation = Abstraction.createImplementation({
    implementation: EntrySearchImpl,
    dependencies: [
        KnexClient,
        PgSchema,
        ScopeRegistry,
        StorageTransformRegistry,
        CmsStorageModelProvider,
        FieldFilterPathRegistry,
        FieldFilterValueTransformRegistry,
        FieldFilterCreateRegistry,
        FieldSortingRegistry,
        ValueFilterRegistry,
        PgStorageConfig
    ]
});
