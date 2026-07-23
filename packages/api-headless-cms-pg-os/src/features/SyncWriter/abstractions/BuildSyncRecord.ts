import { createAbstraction } from "@webiny/feature/api";
import type {
    CmsEntry,
    CmsEntryValues,
    CmsStorageEntry,
    StorageOperationsCmsModel
} from "@webiny/api-headless-cms/types/index.js";
import type { ISyncRow } from "~/types.js";

export type RecordKind = "latest" | "published";

export interface IBuildSyncRecordParams<T extends CmsEntryValues = CmsEntryValues> {
    model: StorageOperationsCmsModel<T>;
    entry: CmsEntry<T>;
    storageEntry: CmsStorageEntry<T>;
    kind: RecordKind;
}

export interface IBuildSyncRecord {
    execute<T extends CmsEntryValues = CmsEntryValues>(
        params: IBuildSyncRecordParams<T>
    ): Promise<ISyncRow>;
}

export const BuildSyncRecord = createAbstraction<IBuildSyncRecord>(
    "Cms/Pg/Os/SyncWriter/BuildSyncRecord"
);

export namespace BuildSyncRecord {
    export type Interface = IBuildSyncRecord;
    export type Params<T extends CmsEntryValues = CmsEntryValues> = IBuildSyncRecordParams<T>;
    export type Kind = RecordKind;
}
