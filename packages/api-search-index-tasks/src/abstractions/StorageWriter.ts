import { createAbstraction } from "@webiny/feature/api";
import type { GenericRecord } from "@webiny/api/types.js";

export interface IStorageWriterRecord {
    entity: string;
    data: GenericRecord;
}

export interface IStorageWriter {
    put(record: IStorageWriterRecord): void;
    execute(): Promise<void>;
}

export const StorageWriter = createAbstraction<IStorageWriter>("SearchIndexTasks/StorageWriter");

export namespace StorageWriter {
    export type Interface = IStorageWriter;
    export type Record = IStorageWriterRecord;
}
