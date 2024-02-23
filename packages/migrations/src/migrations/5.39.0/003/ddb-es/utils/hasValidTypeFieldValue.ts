import { CmsEntry } from "~/migrations/5.39.0/001/types";
import { ScanDbItem } from "@webiny/db-dynamodb";
import {
    createRecordType,
    createLatestRecordType,
    createPublishedRecordType
} from "@webiny/api-headless-cms-ddb-es/operations/entry/recordType";

export const hasValidTypeFieldValue = (entry: ScanDbItem<CmsEntry>) => {
    if (entry.SK.startsWith("REV#")) {
        return entry.TYPE === createRecordType();
    }

    if (entry.SK === "L") {
        return entry.TYPE === createLatestRecordType();
    }

    // SK === "P"
    return entry.TYPE === createPublishedRecordType();
};
