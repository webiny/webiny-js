import { createAbstraction } from "@webiny/feature/api";
import type { GenericRecord } from "@webiny/api/types.js";

export interface IStorageScannerRecord {
    index: string;
    entity: string;
    data: GenericRecord;
    modified: string;
}

export interface IStorageScannerResult {
    items: IStorageScannerRecord[];
    cursor?: string;
}

export interface IStorageScanner {
    scan(cursor: string | undefined, limit: number): Promise<IStorageScannerResult>;
}

export const StorageScanner = createAbstraction<IStorageScanner>(
    "SearchIndexTasks/StorageScanner"
);

export namespace StorageScanner {
    export type Interface = IStorageScanner;
    export type Record = IStorageScannerRecord;
    export type Result = IStorageScannerResult;
}
