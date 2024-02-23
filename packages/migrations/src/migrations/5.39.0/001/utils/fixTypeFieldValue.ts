import { CmsEntry } from "../types";
import { ScanDbItem } from "@webiny/db-dynamodb";
import {
    createRecordType,
    createLatestRecordType,
    createPublishedRecordType
} from "@webiny/api-headless-cms-ddb-es/operations/entry/recordType";

export const fixTypeFieldValue = (entry: ScanDbItem<CmsEntry>) => {
    if (entry.SK.startsWith("REV#")) {
        const TYPE = createRecordType();
        if (entry.TYPE !== TYPE) {
            entry.TYPE = TYPE;
        }
        return;
    }

    if (entry.SK === "L") {
        const TYPE = createLatestRecordType();
        if (entry.TYPE !== TYPE) {
            entry.TYPE = TYPE;
        }
        return;
    }

    if (entry.SK === "P") {
        const TYPE = createPublishedRecordType();
        if (entry.TYPE !== TYPE) {
            entry.TYPE = TYPE;
        }
        return;
    }
};
