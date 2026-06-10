import type { IStorageListParams } from "@webiny/api-audit-logs/storage/abstractions/Storage.js";
import { fetchCursor } from "~/cursorSchema.js";

export interface ICreateStartKeyResult {
    PK: string;
    SK: string;
}

export const createStartKey = (
    params: Pick<IStorageListParams, "after">
): ICreateStartKeyResult | undefined => {
    if (!params.after) {
        return undefined;
    }
    return fetchCursor(params.after);
};
