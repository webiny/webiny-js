import type { IStorageListParams } from "@webiny/api-audit-logs/storage/abstractions/Storage.js";
import { fetchCursor } from "~/cursorSchema.js";

export const createStartKey = (
    params: Pick<IStorageListParams, "after">
): Record<string, unknown> | undefined => {
    if (!params.after) {
        return undefined;
    }
    return fetchCursor(params.after);
};
