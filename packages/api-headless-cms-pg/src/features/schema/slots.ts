/**
 * Typed slot columns of the search table. Every filterable path of a model (system or user field)
 * is mapped to one slot of the family matching its value type:
 *
 * - `t`  text, single value         (text, long-text, ref properties, identity ids, folder id)
 * - `n`  numeric, single value      (number, datetime / date / time as epoch milliseconds)
 * - `b`  boolean, single value
 * - `ta` text[], multiple values    (list fields, values reached through repeatable objects)
 * - `na` numeric[], multiple values
 *
 * The column counts are the physical capacity of the table. How many of them a single model may use
 * is a product constraint, configured separately (`PgStorageConfig.fieldBudget`).
 */
export type SlotFamily = "t" | "n" | "b" | "ta" | "na";

/* "j": searchable-json. No slot; the value goes to the `sj` jsonb column and to `tok` as path=value tokens. */
export type IndexFamily = SlotFamily | "j";

export const SLOT_FAMILIES: SlotFamily[] = ["t", "n", "b", "ta", "na"];

/*
 * Sized so any single model can spend its whole field budget (50) on one family on top of the system
 * fields (~21 text, ~16 numeric, 1 boolean). Empty columns cost one bit per row.
 */
export const SLOT_CAPACITY: Record<SlotFamily, number> = {
    t: 72,
    n: 66,
    b: 52,
    ta: 50,
    na: 50
};

export const SCALAR_FAMILIES: SlotFamily[] = ["t", "n", "b"];

export const isArrayFamily = (family: SlotFamily): boolean => family === "ta" || family === "na";

export const slotColumns = (family: SlotFamily): string[] => {
    const columns: string[] = [];
    for (let i = 1; i <= SLOT_CAPACITY[family]; i++) {
        columns.push(`${family}${i}`);
    }
    return columns;
};

export const familyOfSlot = (slot: string): SlotFamily => {
    const match = /^(ta|na|t|n|b)\d+$/.exec(slot);
    if (!match) {
        throw new Error(`Invalid slot name "${slot}".`);
    }
    return match[1] as SlotFamily;
};
