import type { IStorageListParams } from "~/storage/abstractions/Storage.js";
import { fetchCursor } from "~/storage/cursorSchema.js";

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
