import {
    createFileRecord,
    createLatestSearchRecord,
    createSearchRecordRevision
} from "./createFileRecord";

export const createSourceFileRecords = (amount = 10000) => {
    const records: any[] = [];
    Array.from({ length: amount }).forEach((_, index) => {
        // Legacy file record
        records.push(createFileRecord(index));

        // ACO search record - Latest
        records.push(createLatestSearchRecord(index));

        // ACO search record - Revision
        records.push(createSearchRecordRevision(index));
    });

    return records;
};
