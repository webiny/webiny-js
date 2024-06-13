import {
    createRecordType,
    createLatestRecordType,
    createPublishedRecordType
} from "@webiny/api-headless-cms-ddb-es/operations/entry/recordType";

export const hasValidTypeFieldValue = (entry: { SK: string; TYPE?: string }) => {
    if (entry.SK.startsWith("REV#")) {
        return entry.TYPE === createRecordType();
    }

    if (entry.SK === "L") {
        return entry.TYPE === createLatestRecordType();
    }

    // SK === "P"
    return entry.TYPE === createPublishedRecordType();
};
