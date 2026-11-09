import type { IndexMode } from "~/features/indexMode/indexMode.js";
import type { ScopeRegistry } from "./abstractions.js";

interface ICachedScope {
    scopeId: number;
    slotMap: ScopeRegistry.SlotMap;
    indexMode: IndexMode;
    /* When indexMode was read from the table (Date.now()). */
    modeReadAt: number;
}

/**
 * Process-wide cache of scope ids, slot maps and index modes. Slot maps only ever grow, so a cached
 * map is safe to use until a model gains a path it does not cover; then the registry goes back to
 * the table. Index modes change, so they are re-read once they are older than the mode TTL.
 */
export const scopeCache = new Map<string, ICachedScope>();

export const scopeCacheKey = (scopesTable: string, tenant: string, modelId: string): string =>
    `${scopesTable}#${tenant}#${modelId}`;
