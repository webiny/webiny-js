import type { Knex } from "knex";
import type {
    CmsEntry,
    CmsEntryListWhere,
    CmsEntryStorageOperationsListParams,
    CmsEntryStorageOperationsListResponse,
    CmsEntryValues,
    CmsModel,
    CmsStorageEntry
} from "@webiny/api-headless-cms/types/index.js";
import { decodeCursor, encodeCursor } from "@webiny/utils";
import type { StorageTransformRegistry } from "@webiny/api-headless-cms/exports/api/cms/storage.js";
import type { CmsStorageModelProvider } from "@webiny/api-headless-cms/features/shared/abstractions.js";
import type { ValueFilterRegistry } from "@webiny/db-utils";
import {
    createFields,
    filter,
    sort,
    createStorageTransformCallable
} from "@webiny/api-headless-cms-storage";
import type {
    FieldFilterPathRegistry,
    FieldFilterValueTransformRegistry,
    FieldFilterCreateRegistry,
    FieldSortingRegistry
} from "@webiny/api-headless-cms-storage";
import type { IEntryRow } from "./types.js";
import { rowToEntry, mergeEntryLevelMeta } from "./mappers.js";

export const MAX_LIST_LIMIT = 1000000;

export const createEntryQuery = (knex: Knex, tableName: string): Knex.QueryBuilder<IEntryRow> => {
    return knex<IEntryRow>(tableName);
};

export const syncEntryToLatest = async (
    knex: Knex,
    tableName: string,
    entry: CmsStorageEntry,
    extraPatch?: (latest: CmsEntry) => void
): Promise<void> => {
    if (entry.isLatest) {
        return;
    }

    const latestRow = await createEntryQuery(knex, tableName)
        .where("entryId", entry.entryId)
        .andWhere("isLatest", true)
        .first();

    if (!latestRow) {
        return;
    }

    const latest = JSON.parse(latestRow.data);
    const merged = mergeEntryLevelMeta(entry, latest);

    if (extraPatch) {
        extraPatch(merged);
    }

    await createEntryQuery(knex, tableName)
        .where("id", latestRow.id)
        .update({ data: JSON.stringify(merged) });
};

export const patchAllEntryRevisions = async (
    knex: Knex,
    tableName: string,
    entryId: string,
    tenant: string,
    patch: (entry: CmsEntry) => void,
    columnUpdates?: Partial<IEntryRow>
): Promise<void> => {
    const rows = await createEntryQuery(knex, tableName)
        .where("tenant", tenant)
        .where("entryId", entryId);

    if (rows.length === 0) {
        return;
    }

    const cases: Array<{ id: string; data: string }> = rows.map((row: IEntryRow) => {
        const parsed = JSON.parse(row.data);
        patch(parsed);
        return { id: row.id, data: JSON.stringify(parsed) };
    });

    const update: Record<string, unknown> = {
        data: knex.raw(
            `CASE id ${cases.map(() => "WHEN ? THEN ?").join(" ")} END`,
            cases.flatMap((c: { id: string; data: string }) => [c.id, c.data])
        ),
        ...columnUpdates
    };

    await createEntryQuery(knex, tableName)
        .where("tenant", tenant)
        .where("entryId", entryId)
        .update(update);
};

export interface IListEntriesDeps {
    knex: Knex;
    tableName: string;
    storageModelProvider: CmsStorageModelProvider.Interface;
    storageTransformRegistry: StorageTransformRegistry.Interface;
    pathRegistry: FieldFilterPathRegistry.Interface;
    transformRegistry: FieldFilterValueTransformRegistry.Interface;
    filterCreateRegistry: FieldFilterCreateRegistry.Interface;
    sortingRegistry: FieldSortingRegistry.Interface;
    valueFilterRegistry: ValueFilterRegistry.Interface;
}

export const listEntries = async <T extends CmsEntryValues = CmsEntryValues>(
    deps: IListEntriesDeps,
    initialModel: CmsModel,
    params: CmsEntryStorageOperationsListParams
): Promise<CmsEntryStorageOperationsListResponse<CmsEntry<T>>> => {
    const model = deps.storageModelProvider.getModel(initialModel);
    const {
        where: initialWhere,
        sort: sortBy,
        search,
        fields: searchFields,
        limit: initialLimit,
        after
    } = params;

    const limit =
        initialLimit <= 0 || initialLimit >= MAX_LIST_LIMIT ? MAX_LIST_LIMIT : initialLimit;

    const qb = createEntryQuery(deps.knex, deps.tableName)
        .where("tenant", model.tenant)
        .andWhere("modelId", model.modelId);

    if (initialWhere.entryId) {
        qb.andWhere("entryId", initialWhere.entryId);
    } else if (initialWhere.published === true) {
        qb.andWhere("isPublished", true);
    } else {
        qb.andWhere("isLatest", true);
    }

    if (initialWhere.wbyDeleted !== undefined) {
        qb.andWhere("wbyDeleted", initialWhere.wbyDeleted);
    } else {
        qb.andWhere("wbyDeleted", false);
    }

    const rows: IEntryRow[] = await qb;

    if (rows.length === 0) {
        return {
            hasMoreItems: false,
            totalCount: 0,
            cursor: null,
            items: [] as CmsEntry<T>[]
        };
    }

    const fromStorage = createStorageTransformCallable(deps.storageTransformRegistry, model);

    const records = await Promise.all(
        rows.map(async row => {
            const entry = rowToEntry(row) as CmsStorageEntry;

            for (const field of model.fields) {
                entry.values[field.fieldId] = await fromStorage(
                    field,
                    entry.values[field.fieldId]
                );
            }

            return entry as CmsEntry<T>;
        })
    );

    const where: Partial<CmsEntryListWhere> = { ...initialWhere };
    delete where["published"];
    delete where["latest"];
    delete where["entryId"];
    delete where["wbyDeleted"];

    const modelFields = createFields({
        pathRegistry: deps.pathRegistry,
        transformRegistry: deps.transformRegistry,
        fields: model.fields
    });

    const filteredItems = filter<T>({
        items: records,
        where,
        filterCreateRegistry: deps.filterCreateRegistry,
        transformRegistry: deps.transformRegistry,
        fields: modelFields,
        fullTextSearch: {
            term: search,
            fields: searchFields || []
        },
        valueFilterRegistry: deps.valueFilterRegistry
    });

    const totalCount = filteredItems.length;

    const sortedItems = sort<T>({
        model,
        items: filteredItems,
        sort: sortBy,
        fields: modelFields,
        sortingRegistry: deps.sortingRegistry
    });

    const start = parseInt((decodeCursor(after) as string) || "0") || 0;
    const hasMoreItems = totalCount > start + limit;
    const slicedItems = sortedItems.slice(start, start + limit);
    const cursor = encodeCursor(`${start + limit}`);

    return {
        hasMoreItems,
        totalCount,
        cursor,
        items: slicedItems
    };
};
