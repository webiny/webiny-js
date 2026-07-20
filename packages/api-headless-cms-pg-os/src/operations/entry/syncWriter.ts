import type {
    CmsEntry,
    CmsEntryValues,
    CmsStorageEntry,
    StorageOperationsCmsModel
} from "@webiny/api-headless-cms/types/index.js";
import type { Knex } from "knex";
import { transformEntryToIndex } from "@webiny/api-headless-cms-utils-os/operations/entry/transformations/transformEntryToIndex.js";
import {
    createLatestRecordType,
    createPublishedRecordType
} from "@webiny/api-headless-cms-utils-os/operations/entry/recordType.js";
import { configurations } from "@webiny/api-headless-cms-utils-os/configurations.js";
import { OperationType } from "@webiny/api-sync-to-opensearch/features/Operations/Operations.js";
import type { CmsEntryOpenSearchFieldIndexRegistry } from "@webiny/api-headless-cms-utils-os/exports/api/cms/opensearch.js";
import type { CompressionHandler } from "@webiny/utils/features/compression/abstractions/CompressionHandler.js";
import type { ISyncRow } from "~/types.js";
import type { SyncTableManager } from "~/features/syncTableManager/abstractions.js";

interface SyncWriterParams {
    knex: Knex;
    syncTableManager: SyncTableManager.Interface;
    fieldIndexRegistry: CmsEntryOpenSearchFieldIndexRegistry.Interface;
    compressionHandler: CompressionHandler.Interface;
}

interface WriteEntryParams<T extends CmsEntryValues = CmsEntryValues> {
    model: StorageOperationsCmsModel<T>;
    entry: CmsEntry<T>;
    storageEntry: CmsStorageEntry<T>;
}

interface RemoveEntryParams {
    model: Pick<StorageOperationsCmsModel, "tenant" | "modelId">;
    entryId: string;
}

export interface SyncWriter {
    writeEntry<T extends CmsEntryValues = CmsEntryValues>(
        params: WriteEntryParams<T>
    ): Promise<void>;
    writeLatest<T extends CmsEntryValues = CmsEntryValues>(
        params: WriteEntryParams<T>
    ): Promise<void>;
    writePublished<T extends CmsEntryValues = CmsEntryValues>(
        params: WriteEntryParams<T>
    ): Promise<void>;
    removeEntry(params: RemoveEntryParams): Promise<void>;
    removeLatest(params: RemoveEntryParams): Promise<void>;
    removePublished(params: RemoveEntryParams): Promise<void>;
}

type RecordKind = "latest" | "published";

export const createSyncWriter = (params: SyncWriterParams): SyncWriter => {
    const { knex, syncTableManager, fieldIndexRegistry, compressionHandler } = params;

    const query = (): Knex.QueryBuilder<ISyncRow> => {
        return knex<ISyncRow>(syncTableManager.getTableName());
    };

    const upsert = async (row: ISyncRow): Promise<void> => {
        await query().insert(row).onConflict("id").merge();
    };

    const upsertBatch = async (rows: ISyncRow[]): Promise<void> => {
        if (rows.length === 0) {
            return;
        }
        if (rows.length === 1) {
            return upsert(rows[0]);
        }
        await query().insert(rows).onConflict("id").merge();
    };

    const buildRecord = async <T extends CmsEntryValues>(
        writeParams: WriteEntryParams<T>,
        kind: RecordKind
    ): Promise<ISyncRow> => {
        const { model, entry, storageEntry } = writeParams;

        const indexEntry = transformEntryToIndex({
            model,
            entry,
            storageEntry,
            fieldIndexRegistry
        });

        const isLatest = kind === "latest";
        const recordType = isLatest ? createLatestRecordType() : createPublishedRecordType();

        const document = {
            ...indexEntry,
            ...(isLatest ? { latest: true } : { published: true }),
            TYPE: recordType,
            __type: recordType
        };

        const compressed = await compressionHandler.compress(document);
        const { index } = configurations.es({ model });

        return {
            id: `${entry.entryId}:${isLatest ? "L" : "P"}`,
            entryId: entry.entryId,
            index,
            operation: OperationType.MODIFY,
            data: JSON.stringify(compressed),
            tenant: entry.tenant
        };
    };

    const buildRemoveRecord = (removeParams: RemoveEntryParams, kind: RecordKind): ISyncRow => {
        const { model, entryId } = removeParams;
        const { index } = configurations.es({ model });
        const isLatest = kind === "latest";

        return {
            id: `${entryId}:${isLatest ? "L" : "P"}`,
            entryId,
            index,
            operation: OperationType.REMOVE,
            data: JSON.stringify({}),
            tenant: model.tenant
        };
    };

    return {
        async writeEntry(writeParams) {
            const rows: ISyncRow[] = [await buildRecord(writeParams, "latest")];
            if (writeParams.entry.status === "published") {
                rows.push(await buildRecord(writeParams, "published"));
            }
            await upsertBatch(rows);
        },
        async writeLatest(writeParams) {
            await upsert(await buildRecord(writeParams, "latest"));
        },
        async writePublished(writeParams) {
            await upsert(await buildRecord(writeParams, "published"));
        },
        async removeEntry(removeParams) {
            await upsertBatch([
                buildRemoveRecord(removeParams, "latest"),
                buildRemoveRecord(removeParams, "published")
            ]);
        },
        removeLatest(removeParams) {
            return upsert(buildRemoveRecord(removeParams, "latest"));
        },
        removePublished(removeParams) {
            return upsert(buildRemoveRecord(removeParams, "published"));
        }
    };
};
