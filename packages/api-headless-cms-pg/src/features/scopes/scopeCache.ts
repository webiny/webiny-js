import type { IndexMode } from "~/features/indexMode/indexMode.js";
import type { IIndexPlan } from "~/features/indexPlan/createIndexPlan.js";
import type { ScopeRegistry } from "./abstractions.js";

interface ICachedScope {
    scopeId: number;
    slotMap: ScopeRegistry.SlotMap;
    indexMode: IndexMode;
    /* When indexMode was read from the table (Date.now()). */
    modeReadAt: number;
    /* The model's index plan and the fingerprint of the fields it was built from (planFingerprint). */
    plan: IIndexPlan;
    fingerprint: string;
    /*
     * The scope built from `plan` and `slotMap` once allocateSlots found nothing to change; dropped
     * whenever either of them, or the mode, changes.
     */
    scope: ScopeRegistry.Scope | null;
}

/**
 * Process-wide cache of scope ids, slot maps, index modes and index plans. Slot maps only ever
 * grow, so a cached map is safe to use until a model gains a path it does not cover; then the
 * registry goes back to the table. Index modes change, so they are re-read once they are older than
 * the mode TTL. A plan is reused while the model's fields are the same.
 */
export const scopeCache = new Map<string, ICachedScope>();

export const scopeCacheKey = (scopesTable: string, tenant: string, modelId: string): string =>
    `${scopesTable}#${tenant}#${modelId}`;
