import type { IStorageWriter, IStorageWriterRecord } from "~/abstractions/StorageWriter.js";

export const createMockStorageWriter = () => {
    const written: IStorageWriterRecord[] = [];
    let executeCount = 0;

    const writer: IStorageWriter = {
        put: (record: IStorageWriterRecord) => {
            written.push(record);
        },
        execute: async () => {
            executeCount++;
        }
    };

    return { writer, written, getExecuteCount: () => executeCount };
};
