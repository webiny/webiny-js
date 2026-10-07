import { createHash } from "node:crypto";

/**
 * Each identity has one dashboard entry, so its ID is derived from the identity ID. CMS entry IDs
 * only allow letters, digits and dashes, and identity IDs can contain other characters, so the
 * identity ID is hashed.
 */
export const createDashboardEntryId = (ownerId: string): string => {
    const hash = createHash("sha256").update(ownerId).digest("hex").slice(0, 32);
    return `wby-dashboard-${hash}`;
};
