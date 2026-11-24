import type { Knex } from "knex";
import type {
    CmsEntry,
    CmsEntryListWhere,
    CmsEntryStorageOperationsListParams,
    CmsEntryStorageOperationsListResponse,
    CmsEntryValues,
    CmsStorageEntry,
    StorageOperationsCmsModel
} from "@webiny/api-headless-cms/types/index.js";
import type { StorageTransformRegistry } from "@webiny/api-headless-cms/exports/api/cms/storage.js";
import type { ValueFilterRegistry } from "@webiny/db-utils";
import {
    createFields,
    createStorageTransformCallable,
    filter,
    sort
} from "@webiny/api-headless-cms-storage";
import type {
    FieldFilterCreateRegistry,
    FieldFilterPathRegistry,
    FieldFilterValueTransformRegistry,
    FieldSortingRegistry
} from "@webiny/api-headless-cms-storage";
import type { PgSchema } from "~/features/schema/abstractions.js";
import { rowToEntry } from "./entryRow.js";

interface IListRevisionsOfEntryParams {
    knex: Knex;
    tables: PgSchema.Tables;
    model: StorageOperationsCmsModel;
    params: CmsEntryStorageOperationsListParams;
    storageTransformRegistry: StorageTransformRegistry.Interface;
    pathRegistry: FieldFilterPathRegistry.Interface;
    transformRegistry: FieldFilterValueTransformRegistry.Interface;
    filterCreateRegistry: FieldFilterCreateRegistry.Interface;
    sortingRegistry: FieldSortingRegistry.Interface;
    valueFilterRegistry: ValueFilterRegistry.Interface;
}

/**
 * `where.entryId` without latest/published asks for every revision of one entry. That set is a
 * handful of rows, so it is loaded by entry id and filtered in memory with the shared filter.
 */
export const listRevisionsOfEntry = async <T extends CmsEntryValues = CmsEntryValues>(
    input: IListRevisionsOfEntryParams
): Promise<CmsEntryStorageOperationsListResponse<CmsEntry<T>>> => {
    const { model, params } = input;
    const where: Partial<CmsEntryListWhere> = { ...params.where };
    const entryId = where.entryId as string;
    const wbyDeleted = where.wbyDeleted === true;
    delete where.entryId;
    delete where.published;
    delete where.latest;
    delete where.wbyDeleted;

    const rows: { data: CmsStorageEntry }[] = await input
        .knex(input.tables.entries)
        .select("data")
        .where({
            tenant: model.tenant,
            model_id: model.modelId,
            entry_id: entryId,
            wby_deleted: wbyDeleted
        });

    const fromStorage = createStorageTransformCallable(input.storageTransformRegistry, model);
    const records: CmsEntry<T>[] = [];
    for (const row of rows) {
        const entry = rowToEntry(row, model);
        for (const field of model.fields) {
            entry.values[field.fieldId] = await fromStorage(field, entry.values[field.fieldId]);
        }
        records.push(entry as unknown as CmsEntry<T>);
    }

    const fields = createFields({
        pathRegistry: input.pathRegistry,
        transformRegistry: input.transformRegistry,
        fields: model.fields
    });
    const filtered = filter<T>({
        items: records,
        where,
        filterCreateRegistry: input.filterCreateRegistry,
        transformRegistry: input.transformRegistry,
        fields,
        fullTextSearch: { term: params.search, fields: params.fields || [] },
        valueFilterRegistry: input.valueFilterRegistry
    });
    const items = sort<T>({
        model,
        items: filtered,
        sort: params.sort,
        fields,
        sortingRegistry: input.sortingRegistry
    });
    return { hasMoreItems: false, totalCount: items.length, cursor: null, items };
};
