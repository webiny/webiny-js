import type {
    CmsEntry,
    CmsEntryListWhere,
    CmsEntryStorageOperationsCreateParams,
    CmsEntryStorageOperationsCreateRevisionFromParams,
    CmsEntryStorageOperationsDeleteEntriesParams,
    CmsEntryStorageOperationsDeleteParams,
    CmsEntryStorageOperationsDeleteRevisionParams,
    CmsEntryStorageOperationsGetByIdsParams,
    CmsEntryStorageOperationsGetLatestByIdsParams,
    CmsEntryStorageOperationsGetLatestRevisionParams,
    CmsEntryStorageOperationsGetParams,
    CmsEntryStorageOperationsGetPreviousRevisionParams,
    CmsEntryStorageOperationsGetPublishedByIdsParams,
    CmsEntryStorageOperationsGetPublishedRevisionParams,
    CmsEntryStorageOperationsGetRevisionParams,
    CmsEntryStorageOperationsGetRevisionsParams,
    CmsEntryStorageOperationsGetUniqueFieldValuesParams,
    CmsEntryStorageOperationsListParams,
    CmsEntryStorageOperationsMoveToBinParams,
    CmsEntryStorageOperationsPublishParams,
    CmsEntryStorageOperationsRestoreFromBinParams,
    CmsEntryStorageOperationsUnpublishParams,
    CmsEntryStorageOperationsUpdateParams,
    CmsEntryValues,
    CmsModel,
    CmsStorageEntry
} from "@webiny/api-headless-cms/types/index.js";
import type { Knex } from "knex";
import { KnexClient } from "@webiny/api-core-sql";
import { parseIdentifier, decodeCursor, encodeCursor } from "@webiny/utils";
import { StorageTransformRegistry } from "@webiny/api-headless-cms/exports/api/cms/storage.js";
import { CmsStorageModelProvider } from "@webiny/api-headless-cms/features/shared/abstractions.js";
import { ValueFilterRegistry } from "@webiny/db-utils";
import {
    createFields,
    filter,
    sort,
    createStorageTransformCallable,
    aggregateUniqueFieldValues,
    FieldFilterPathRegistry,
    FieldFilterValueTransformRegistry,
    FieldFilterCreateRegistry,
    FieldSortingRegistry
} from "@webiny/api-headless-cms-storage";
import { SqlEntryOperations as Abstraction } from "./abstractions/SqlEntryOperations.js";
import { EntryTableManager } from "~/features/entryTableManager/abstractions.js";
import type { IEntryRow } from "./types.js";
import { entryToRow, rowToEntry, mergeEntryLevelMeta } from "./mappers.js";

const MAX_LIST_LIMIT = 1000000;

class SqlEntryOperationsImpl implements Abstraction.Interface {
    private readonly knex: Knex;

    public constructor(
        knexClient: KnexClient.Interface,
        private readonly entryTableManager: EntryTableManager.Interface,
        private readonly storageTransformRegistry: StorageTransformRegistry.Interface,
        private readonly storageModelProvider: CmsStorageModelProvider.Interface,
        private readonly pathRegistry: FieldFilterPathRegistry.Interface,
        private readonly transformRegistry: FieldFilterValueTransformRegistry.Interface,
        private readonly filterCreateRegistry: FieldFilterCreateRegistry.Interface,
        private readonly sortingRegistry: FieldSortingRegistry.Interface,
        private readonly valueFilterRegistry: ValueFilterRegistry.Interface
    ) {
        this.knex = knexClient.client;
    }

    private query(): Knex.QueryBuilder<IEntryRow> {
        return this.knex<IEntryRow>(this.entryTableManager.getTableName());
    }

    private async syncToLatest(
        entry: CmsStorageEntry,
        extraPatch?: (latest: CmsEntry) => void
    ): Promise<void> {
        if (entry.isLatest) {
            return;
        }

        const latestRow = await this.query()
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

        await this.query()
            .where("id", latestRow.id)
            .update({ data: JSON.stringify(merged) });
    }

    private async patchAllRevisions(
        entryId: string,
        tenant: string,
        patch: (entry: CmsEntry) => void,
        columnUpdates?: Partial<IEntryRow>
    ): Promise<void> {
        const rows = await this.query().where("tenant", tenant).where("entryId", entryId);

        if (rows.length === 0) {
            return;
        }

        const cases: Array<{ id: string; data: string }> = rows.map((row: IEntryRow) => {
            const parsed = JSON.parse(row.data);
            patch(parsed);
            return { id: row.id, data: JSON.stringify(parsed) };
        });

        const update: Record<string, unknown> = {
            data: this.knex.raw(
                `CASE id ${cases.map(() => "WHEN ? THEN ?").join(" ")} END`,
                cases.flatMap((c: { id: string; data: string }) => [c.id, c.data])
            ),
            ...columnUpdates
        };

        await this.query().where("tenant", tenant).where("entryId", entryId).update(update);
    }

    private async listEntries<T extends CmsEntryValues = CmsEntryValues>(
        initialModel: CmsModel,
        params: CmsEntryStorageOperationsListParams
    ) {
        await this.entryTableManager.ensureTable();

        const model = this.storageModelProvider.getModel(initialModel);
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

        const qb = this.query().where("tenant", model.tenant).andWhere("modelId", model.modelId);

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

        const fromStorage = createStorageTransformCallable(this.storageTransformRegistry, model);

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
            pathRegistry: this.pathRegistry,
            transformRegistry: this.transformRegistry,
            fields: model.fields
        });

        const filteredItems = filter<T>({
            items: records,
            where,
            filterCreateRegistry: this.filterCreateRegistry,
            transformRegistry: this.transformRegistry,
            fields: modelFields,
            fullTextSearch: {
                term: search,
                fields: searchFields || []
            },
            valueFilterRegistry: this.valueFilterRegistry
        });

        const totalCount = filteredItems.length;

        const sortedItems = sort<T>({
            model,
            items: filteredItems,
            sort: sortBy,
            fields: modelFields,
            sortingRegistry: this.sortingRegistry
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
    }

    async getByIds<T extends CmsEntryValues = CmsEntryValues>(
        model: CmsModel,
        params: CmsEntryStorageOperationsGetByIdsParams
    ) {
        await this.entryTableManager.ensureTable();

        const idList = params.ids as string[];

        const rows: IEntryRow[] = await this.query()
            .where("tenant", model.tenant)
            .andWhere("modelId", model.modelId)
            .whereIn("id", idList);

        const entries = rows.map(row => rowToEntry(row));
        const byId = new Map(entries.map(e => [e.id, e]));

        return idList.map(id => byId.get(id)).filter(Boolean) as CmsEntry<T>[];
    }

    async getPublishedByIds<T extends CmsEntryValues = CmsEntryValues>(
        model: CmsModel,
        params: CmsEntryStorageOperationsGetPublishedByIdsParams
    ) {
        await this.entryTableManager.ensureTable();

        const idList = params.ids as string[];
        const entryIds = idList.map(id => parseIdentifier(id).id);

        const rows: IEntryRow[] = await this.query()
            .where("tenant", model.tenant)
            .andWhere("modelId", model.modelId)
            .whereIn("entryId", entryIds)
            .andWhere("isPublished", true);

        const entries = rows.map(row => rowToEntry(row));
        const byEntryId = new Map(entries.map(e => [e.entryId, e]));

        return entryIds.map(eid => byEntryId.get(eid)).filter(Boolean) as CmsEntry<T>[];
    }

    async getLatestByIds<T extends CmsEntryValues = CmsEntryValues>(
        model: CmsModel,
        params: CmsEntryStorageOperationsGetLatestByIdsParams
    ) {
        await this.entryTableManager.ensureTable();

        const idList = params.ids as string[];
        const entryIds = idList.map(id => parseIdentifier(id).id);

        const rows: IEntryRow[] = await this.query()
            .where("tenant", model.tenant)
            .andWhere("modelId", model.modelId)
            .whereIn("entryId", entryIds)
            .andWhere("isLatest", true);

        const entries = rows.map(row => rowToEntry(row));
        const byEntryId = new Map(entries.map(e => [e.entryId, e]));

        return entryIds.map(eid => byEntryId.get(eid)).filter(Boolean) as CmsEntry<T>[];
    }

    async getRevisions<T extends CmsEntryValues>(
        model: CmsModel,
        params: CmsEntryStorageOperationsGetRevisionsParams
    ) {
        await this.entryTableManager.ensureTable();

        const { id: entryId } = parseIdentifier(params.id);

        const rows: IEntryRow[] = await this.query()
            .where("tenant", model.tenant)
            .andWhere("modelId", model.modelId)
            .where("entryId", entryId)
            .orderBy("version", "desc");

        return rows.map(row => rowToEntry<T>(row));
    }

    async getRevisionById<T extends CmsEntryValues>(
        model: CmsModel,
        params: CmsEntryStorageOperationsGetRevisionParams
    ) {
        await this.entryTableManager.ensureTable();

        const row = await this.query()
            .where("tenant", model.tenant)
            .andWhere("modelId", model.modelId)
            .where("id", params.id)
            .first();

        if (!row) {
            return null;
        }

        return rowToEntry<T>(row);
    }

    async getPublishedRevisionByEntryId<T extends CmsEntryValues>(
        model: CmsModel,
        params: CmsEntryStorageOperationsGetPublishedRevisionParams
    ) {
        await this.entryTableManager.ensureTable();

        const { id: entryId } = parseIdentifier(params.id);

        const row = await this.query()
            .where("tenant", model.tenant)
            .andWhere("modelId", model.modelId)
            .where("entryId", entryId)
            .andWhere("isPublished", true)
            .first();

        if (!row) {
            return null;
        }

        return rowToEntry<T>(row);
    }

    async getLatestRevisionByEntryId<T extends CmsEntryValues>(
        model: CmsModel,
        params: CmsEntryStorageOperationsGetLatestRevisionParams
    ) {
        await this.entryTableManager.ensureTable();

        const { id: entryId } = parseIdentifier(params.id);

        const row = await this.query()
            .where("tenant", model.tenant)
            .andWhere("modelId", model.modelId)
            .where("entryId", entryId)
            .andWhere("isLatest", true)
            .first();

        if (!row) {
            return null;
        }

        return rowToEntry<T>(row);
    }

    async getPreviousRevision<T extends CmsEntryValues>(
        model: CmsModel,
        params: CmsEntryStorageOperationsGetPreviousRevisionParams
    ) {
        await this.entryTableManager.ensureTable();

        const row = await this.query()
            .where("tenant", model.tenant)
            .andWhere("modelId", model.modelId)
            .where("entryId", params.entryId)
            .andWhere("version", "<", params.version)
            .orderBy("version", "desc")
            .first();

        if (!row) {
            return null;
        }

        return rowToEntry<T>(row);
    }

    async get<T extends CmsEntryValues = CmsEntryValues>(
        model: CmsModel,
        params: CmsEntryStorageOperationsGetParams
    ) {
        const { items } = await this.listEntries<T>(model, { ...params, limit: 1 });
        return items.shift() || null;
    }

    async list<T extends CmsEntryValues = CmsEntryValues>(
        model: CmsModel,
        params: CmsEntryStorageOperationsListParams
    ) {
        return this.listEntries<T>(model, params);
    }

    async create<T extends CmsEntryValues>(
        model: CmsModel,
        params: CmsEntryStorageOperationsCreateParams<T>
    ) {
        await this.entryTableManager.ensureTable();

        const storageEntry = structuredClone(params.storageEntry);
        storageEntry.isLatest = true;
        storageEntry.isPublished = storageEntry.status === "published";

        const row = entryToRow(storageEntry);
        await this.query().insert(row);

        return storageEntry;
    }

    async createRevisionFrom<T extends CmsEntryValues>(
        model: CmsModel,
        params: CmsEntryStorageOperationsCreateRevisionFromParams<T>
    ) {
        await this.entryTableManager.ensureTable();

        const isPublished = params.entry.status === "published";

        const oldLatestRows = await this.query()
            .where("tenant", model.tenant)
            .andWhere("entryId", params.entry.entryId)
            .andWhere("isLatest", true);

        for (const row of oldLatestRows) {
            const parsed = JSON.parse(row.data);
            parsed.isLatest = false;

            await this.query()
                .where("id", row.id)
                .update({ isLatest: false, data: JSON.stringify(parsed) });
        }

        if (isPublished) {
            const oldPublishedRows = await this.query()
                .where("tenant", model.tenant)
                .andWhere("entryId", params.entry.entryId)
                .andWhere("isPublished", true);

            for (const row of oldPublishedRows) {
                const parsed = JSON.parse(row.data);
                parsed.isPublished = false;
                parsed.status = "unpublished";

                await this.query()
                    .where("id", row.id)
                    .update({ isPublished: false, data: JSON.stringify(parsed) });
            }
        }

        const se = params.storageEntry as CmsStorageEntry;
        se.isLatest = true;
        se.isPublished = isPublished;

        const row = entryToRow(se);
        await this.query().insert(row);

        return params.entry;
    }

    async update<T extends CmsEntryValues>(
        model: CmsModel,
        params: CmsEntryStorageOperationsUpdateParams<T>
    ) {
        await this.entryTableManager.ensureTable();

        const existing = await this.query().where("id", params.storageEntry.id).first();
        const se = params.storageEntry as CmsStorageEntry;
        se.isLatest = existing?.isLatest ?? se.isLatest;
        se.isPublished = existing?.isPublished ?? se.isPublished;

        const row = entryToRow(se);
        const { isLatest: _il, isPublished: _ip, ...rowWithoutFlags } = row;

        await this.query()
            .where("tenant", model.tenant)
            .andWhere("id", params.storageEntry.id)
            .update(rowWithoutFlags);

        await this.syncToLatest(se);

        return params.entry;
    }

    async publish<T extends CmsEntryValues>(
        model: CmsModel,
        params: CmsEntryStorageOperationsPublishParams<T>
    ) {
        await this.entryTableManager.ensureTable();

        const oldPublishedRows = await this.query()
            .where("tenant", model.tenant)
            .andWhere("entryId", params.entry.entryId)
            .andWhere("isPublished", true);

        for (const row of oldPublishedRows) {
            const parsed = JSON.parse(row.data);
            parsed.isPublished = false;
            parsed.status = "unpublished";

            await this.query()
                .where("id", row.id)
                .update({ isPublished: false, data: JSON.stringify(parsed) });
        }

        const existing = await this.query().where("id", params.storageEntry.id).first();
        const se = params.storageEntry as CmsStorageEntry;
        se.isLatest = existing?.isLatest ?? se.isLatest;
        se.isPublished = true;

        const row = entryToRow(se);
        const { isLatest: _il, ...rowWithoutIsLatest } = row;

        await this.query()
            .where("tenant", model.tenant)
            .andWhere("id", params.storageEntry.id)
            .update(rowWithoutIsLatest);

        const liveValue = { version: params.entry.version };
        await this.syncToLatest(se, latest => {
            latest.live = liveValue;
        });

        return params.entry;
    }

    async unpublish<T extends CmsEntryValues>(
        model: CmsModel,
        params: CmsEntryStorageOperationsUnpublishParams<T>
    ) {
        await this.entryTableManager.ensureTable();

        const existing = await this.query().where("id", params.storageEntry.id).first();
        const se = params.storageEntry as CmsStorageEntry;
        se.isLatest = existing?.isLatest ?? se.isLatest;
        se.isPublished = false;

        const row = entryToRow(se);
        const { isLatest: _il, ...rowWithoutIsLatest } = row;

        await this.query()
            .where("tenant", model.tenant)
            .andWhere("id", params.storageEntry.id)
            .update(rowWithoutIsLatest);

        await this.syncToLatest(se, latest => {
            latest.live = null;
        });

        return params.entry;
    }

    async move(model: CmsModel, id: string, folderId: string) {
        await this.entryTableManager.ensureTable();

        const { id: entryId } = parseIdentifier(id);

        await this.patchAllRevisions(entryId, model.tenant, parsed => {
            parsed.location = { folderId };
        });
    }

    async moveToBin(model: CmsModel, params: CmsEntryStorageOperationsMoveToBinParams) {
        await this.entryTableManager.ensureTable();

        await this.patchAllRevisions(
            params.entry.entryId,
            model.tenant,
            parsed => {
                const p = parsed as unknown as Record<string, unknown>;
                p["wbyDeleted"] = true;
                p["binOriginalFolderId"] = params.storageEntry.binOriginalFolderId ?? null;
                p["location"] = params.storageEntry.location ?? null;

                const fields = Object.keys(params.storageEntry);
                for (const field of fields) {
                    if (field === "createdOn" || field === "createdBy") {
                        continue;
                    }
                    if (
                        (field.endsWith("On") || field.endsWith("By")) &&
                        !field.startsWith("revision")
                    ) {
                        p[field] = (params.storageEntry as Record<string, unknown>)[field];
                    }
                }
            },
            {
                wbyDeleted: true
            }
        );
    }

    async restoreFromBin<T extends CmsEntryValues>(
        model: CmsModel,
        params: CmsEntryStorageOperationsRestoreFromBinParams<T>
    ) {
        await this.entryTableManager.ensureTable();

        await this.patchAllRevisions(
            params.entry.entryId,
            model.tenant,
            parsed => {
                const p = parsed as unknown as Record<string, unknown>;
                p["wbyDeleted"] = false;
                p["binOriginalFolderId"] = null;
                p["location"] = params.storageEntry.location ?? null;

                const fields = Object.keys(params.storageEntry);
                for (const field of fields) {
                    if (field === "createdOn" || field === "createdBy") {
                        continue;
                    }
                    if (
                        (field.endsWith("On") || field.endsWith("By")) &&
                        !field.startsWith("revision")
                    ) {
                        p[field] = (params.storageEntry as Record<string, unknown>)[field];
                    }
                }
            },
            { wbyDeleted: false }
        );

        return params.entry;
    }

    async deleteRevision<T extends CmsEntryValues>(
        model: CmsModel,
        params: CmsEntryStorageOperationsDeleteRevisionParams<T>
    ) {
        await this.entryTableManager.ensureTable();

        const wasPublished = params.storageEntry.status === "published";

        await this.query()
            .where("tenant", model.tenant)
            .andWhere("id", params.storageEntry.id)
            .delete();

        if (wasPublished) {
            await this.patchAllRevisions(params.storageEntry.entryId, model.tenant, parsed => {
                parsed.live = null;
            });
        }

        if (params.latestStorageEntry) {
            const latestParsed = structuredClone(params.latestStorageEntry);
            latestParsed.isLatest = true;

            if (wasPublished) {
                latestParsed.live = null;
            }

            const latestRow = entryToRow(latestParsed as CmsStorageEntry);

            await this.query()
                .where("tenant", model.tenant)
                .andWhere("id", params.latestStorageEntry.id)
                .update(latestRow);
        }
    }

    async delete(model: CmsModel, params: CmsEntryStorageOperationsDeleteParams) {
        await this.entryTableManager.ensureTable();

        const { id: entryId } = parseIdentifier(params.entry.id);

        await this.query().where("tenant", model.tenant).andWhere("entryId", entryId).delete();
    }

    async deleteMultipleEntries(
        model: CmsModel,
        params: CmsEntryStorageOperationsDeleteEntriesParams
    ) {
        await this.entryTableManager.ensureTable();

        const entryIds = params.entries.map(id => parseIdentifier(id).id);

        await this.query().where("tenant", model.tenant).whereIn("entryId", entryIds).delete();
    }

    async getUniqueFieldValues(
        model: CmsModel,
        params: CmsEntryStorageOperationsGetUniqueFieldValuesParams
    ) {
        const field = model.fields.find(f => f.fieldId === params.fieldId);

        if (!field) {
            return [];
        }

        const { items } = await this.listEntries(model, {
            where: params.where,
            limit: MAX_LIST_LIMIT
        });

        return aggregateUniqueFieldValues(items, field.fieldId);
    }
}

export const SqlEntryOperations = Abstraction.createImplementation({
    implementation: SqlEntryOperationsImpl,
    dependencies: [
        KnexClient,
        EntryTableManager,
        StorageTransformRegistry,
        CmsStorageModelProvider,
        FieldFilterPathRegistry,
        FieldFilterValueTransformRegistry,
        FieldFilterCreateRegistry,
        FieldSortingRegistry,
        ValueFilterRegistry
    ]
});
