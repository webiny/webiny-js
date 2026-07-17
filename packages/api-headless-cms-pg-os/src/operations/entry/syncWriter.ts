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
    writeLatest<T extends CmsEntryValues = CmsEntryValues>(
        params: WriteEntryParams<T>
    ): Promise<void>;
    writePublished<T extends CmsEntryValues = CmsEntryValues>(
        params: WriteEntryParams<T>
    ): Promise<void>;
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

    const writeRecord = async <T extends CmsEntryValues>(
        writeParams: WriteEntryParams<T>,
        kind: RecordKind
    ): Promise<void> => {
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

        await upsert({
            id: `${entry.entryId}:${isLatest ? "L" : "P"}`,
            entryId: entry.entryId,
            index,
            operation: OperationType.MODIFY,
            data: JSON.stringify(compressed),
            tenant: entry.tenant
        });
    };

    const removeRecord = async (
        removeParams: RemoveEntryParams,
        kind: RecordKind
    ): Promise<void> => {
        const { model, entryId } = removeParams;
        const { index } = configurations.es({ model });
        const isLatest = kind === "latest";

        await upsert({
            id: `${entryId}:${isLatest ? "L" : "P"}`,
            entryId,
            index,
            operation: OperationType.REMOVE,
            data: JSON.stringify({}),
            tenant: model.tenant
        });
    };

    return {
        writeLatest(writeParams) {
            return writeRecord(writeParams, "latest");
        },
        writePublished(writeParams) {
            return writeRecord(writeParams, "published");
        },
        removeLatest(removeParams) {
            return removeRecord(removeParams, "latest");
        },
        removePublished(removeParams) {
            return removeRecord(removeParams, "published");
        }
    };
};
