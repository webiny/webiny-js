import type { CmsEntry } from "~/types/index.js";

export interface IRawInput {
    expiresAt: Date | number | null | undefined;
}

export const getExpiresAt = (input: IRawInput, original?: CmsEntry): number | null => {
    if (input.expiresAt === undefined) {
        return original?.expiresAt ?? null;
    } else if (input.expiresAt instanceof Date) {
        return input.expiresAt.getTime() / 1000;
    } else if (
        typeof input.expiresAt === "number" &&
        !isNaN(input.expiresAt) &&
        input.expiresAt > 0
    ) {
        return input.expiresAt;
    }
    return null;
};
