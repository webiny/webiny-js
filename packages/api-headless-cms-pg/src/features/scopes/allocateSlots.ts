import type { IIndexPath, IIndexPlan } from "~/features/indexPlan/createIndexPlan.js";
import type { SlotFamily } from "~/features/schema/slots.js";
import { familyOfSlot, SLOT_CAPACITY } from "~/features/schema/slots.js";
import type { ScopeRegistry } from "./abstractions.js";

type ISlotPath = IIndexPath & { family: SlotFamily };

/* Families whose rows carry a null token for a missing value (sorted lists find NULL rows by it). */
const SORTABLE_FAMILIES = new Set<SlotFamily>(["t", "n", "b"]);

export interface IAllocateContext {
    /* The scope already has search rows, so a new key may need work on them. */
    hasRows: boolean;
    /*
     * A code model: a field added under a storageId seen before (same type and name) finds its
     * values in the stored entries. UI fields get a new storageId each time, so they never do.
     */
    codeModel: boolean;
}

interface IAllocateResult {
    slotMap: ScopeRegistry.SlotMap;
    /* The map differs from `current` and must be stored. */
    changed: boolean;
}

/* The search settings a text key's rows are built with: "s" = substrings, "p" = phrases. */
export const settingsOf = (entry: IIndexPath): string | undefined => {
    if (entry.family !== "t" && entry.family !== "ta") {
        return undefined;
    }
    return `${entry.substrings ? "s" : "-"}${entry.phrases ? "p" : "-"}`;
};

/**
 * Reconciles a scope's slot map with its model's plan (model changes spec, §5): gives every new key
 * a slot (or overflow, or JSON / full-text keys), keeping existing assignments stable; retires the
 * assignments of keys that left the model; and records which keys need work on existing rows. No
 * rows are touched here: ModelStorageSync does that work in the background.
 *
 * System paths are allocated first and never count against the per-model caps.
 */
export const allocateSlots = (
    plan: IIndexPlan,
    current: ScopeRegistry.SlotMap,
    budget: number,
    context: IAllocateContext = { hasRows: false, codeModel: false }
): IAllocateResult => {
    const slotMap: ScopeRegistry.SlotMap = {
        version: 2,
        slots: { ...current.slots },
        ft: { ...current.ft },
        json: { ...current.json },
        overflow: { ...current.overflow },
        unindexed: {},
        state: { ...current.state },
        settings: { ...current.settings },
        retired: [...(current.retired || [])],
        gone: { ...current.gone }
    };
    const state = slotMap.state!;
    const settings = slotMap.settings!;
    const retired = slotMap.retired!;
    const gone = slotMap.gone!;
    let changed = current.version !== 2;

    // Work on existing rows for a key that just got its assignment.
    const markNew = (key: string, sortableSlot: boolean): void => {
        const cameBack = gone[key] === true;
        delete gone[key];
        if (!context.hasRows) {
            return;
        }
        if (context.codeModel || cameBack) {
            state[key] = "reindex";
        } else if (sortableSlot && state[key] !== "reindex") {
            state[key] = "filling";
        }
    };
    const markReindex = (key: string): void => {
        if (context.hasRows) {
            state[key] = "reindex";
        }
    };

    // Keys that left the model: their slot stays taken until its column and tokens are cleared.
    const planned = new Set(Object.values(plan.paths).map(entry => entry.key));
    for (const [key, slot] of Object.entries(slotMap.slots)) {
        if (!planned.has(key)) {
            retired.push({ key, slot });
            delete slotMap.slots[key];
            changed = true;
        }
    }
    for (const key of Object.keys(slotMap.overflow)) {
        if (!planned.has(key)) {
            retired.push({ key, overflow: true });
            delete slotMap.overflow[key];
            changed = true;
        }
    }
    for (const key of Object.keys(state)) {
        if (!planned.has(key)) {
            delete state[key];
            changed = true;
        }
    }

    const used = new Set([
        ...Object.values(slotMap.slots),
        ...retired.flatMap(entry => (entry.slot ? [entry.slot] : []))
    ]);
    let userSlots = 0;

    for (const entry of Object.values(plan.paths)) {
        if (entry.family !== "j") {
            continue;
        }
        if (!slotMap.json[entry.key]) {
            slotMap.json[entry.key] = `j${Object.keys(slotMap.json).length + 1}`;
            markNew(entry.key, false);
            changed = true;
        }
        if (!slotMap.ft[entry.key]) {
            slotMap.ft[entry.key] = `f${Object.keys(slotMap.ft).length + 1}`;
            changed = true;
        }
    }

    const slotted = Object.values(plan.paths)
        .filter((entry): entry is ISlotPath => entry.family !== "j")
        .sort((a, b) => Number(b.system) - Number(a.system));

    // A key whose family changed (e.g. its field became a list) keeps its values in the stored
    // entries, but its old column holds them in the old shape: retire it, rebuild into a new one.
    const familyChanged = new Set<string>();
    for (const entry of slotted) {
        const slot = slotMap.slots[entry.key];
        if (slot && familyOfSlot(slot) !== entry.family) {
            retired.push({ key: entry.key, slot });
            delete slotMap.slots[entry.key];
            familyChanged.add(entry.key);
            changed = true;
        }
    }
    for (const entry of slotted) {
        if (slotMap.slots[entry.key] && !entry.system) {
            userSlots++;
        }
    }

    for (const entry of slotted) {
        const { key } = entry;
        let ftAdded = false;
        // Full-text keys are independent of slots: a text field over the cap is still searchable.
        if ((entry.family === "t" || entry.family === "ta") && !slotMap.ft[key]) {
            slotMap.ft[key] = `f${Object.keys(slotMap.ft).length + 1}`;
            ftAdded = true;
            changed = true;
        }
        if (slotMap.slots[key]) {
            if (ftAdded) {
                // An existing key became text-searchable: its rows have no lexemes yet.
                markReindex(key);
            }
        } else if (!entry.system && userSlots >= budget) {
            if (!slotMap.overflow[key]) {
                slotMap.overflow[key] = true;
                markNew(key, false);
                changed = true;
            }
        } else {
            let assigned: string | undefined;
            for (let i = 1; i <= SLOT_CAPACITY[entry.family]; i++) {
                const candidate = `${entry.family}${i}`;
                if (!used.has(candidate)) {
                    assigned = candidate;
                    break;
                }
            }
            if (!assigned) {
                // Physical capacity is sized above the budget, so this only happens with many system fields.
                if (!slotMap.overflow[key]) {
                    slotMap.overflow[key] = true;
                    markNew(key, false);
                    changed = true;
                }
            } else {
                const wasOverflow = slotMap.overflow[key] === true;
                used.add(assigned);
                slotMap.slots[key] = assigned;
                delete slotMap.overflow[key];
                if (!entry.system) {
                    userSlots++;
                }
                if (wasOverflow || familyChanged.has(key)) {
                    // The values exist, in the overflow column or in the old slot's shape.
                    markReindex(key);
                } else {
                    markNew(key, SORTABLE_FAMILIES.has(entry.family));
                }
                changed = true;
            }
        }

        // Search settings the rows are built with. A change rebuilds them; until then the old
        // settings stay recorded, so queries use only what both old and new rows satisfy.
        const wanted = settingsOf(entry);
        if (wanted !== undefined && settings[key] !== wanted) {
            if (settings[key] === undefined || !context.hasRows) {
                settings[key] = wanted;
                changed = true;
            } else if (state[key] !== "reindex") {
                state[key] = "reindex";
                changed = true;
            }
        }
    }

    for (const [path, type] of Object.entries(plan.unsupported)) {
        slotMap.unindexed[path] = type;
    }

    return { slotMap, changed };
};
