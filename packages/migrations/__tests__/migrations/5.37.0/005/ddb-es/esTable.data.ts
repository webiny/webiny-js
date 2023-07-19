import { createGzipCompression } from "@webiny/api-elasticsearch";
import {
    createFileRecord,
    createLatestSearchRecord
} from "~tests/migrations/5.37.0/005/ddb-es/createFileRecord";

const compression = createGzipCompression();

export const createSourceEsTableRecords = async (amount = 10000) => {
    const records: any[] = [];

    for (let index = 0; index < amount; index++) {
        const acoRecord = createLatestSearchRecord(index);
        const fileRecord = createFileRecord(index);

        records.push({
            index: "root-headless-cms-en-us-acosearchrecord",
            _md: "2023-06-27T14:06:40.523Z",
            data: await compression.compress(acoRecord),
            SK: "L",
            PK: acoRecord.PK,
            _et: "CmsEntriesElasticsearch",
            _ct: "2023-06-27T14:06:40.523Z"
        });

        records.push({
            index: "root-en-us-file-manager",
            _md: "2023-06-27T14:05:12.366Z",
            data: await compression.compress(fileRecord.data),
            SK: "A",
            PK: fileRecord.PK,
            _et: "FilesElasticsearch",
            _ct: "2023-06-27T14:05:12.366Z"
        });
    }

    return records;
};
