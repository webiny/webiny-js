import { createAbstraction } from "@webiny/feature/api";
import type { ActivityTarget } from "../types.js";

/**
 * Supplies the per-target salt mixed into every hash.
 *
 * Salting per target means a hash from one entry cannot be compared against a hash from another,
 * so the log cannot be used to discover that two entries hold the same value. It is an
 * abstraction rather than a constant because the salt's *source* is a security decision: a
 * target-derived salt is predictable, which is enough to defeat cross-target correlation but not
 * enough to stop someone with read access brute-forcing a low-cardinality field.
 */
export interface IActivityHashSalt {
    forTarget(target: ActivityTarget): string;
}

export const ActivityHashSalt = createAbstraction<IActivityHashSalt>("ActivityLog/HashSalt");

export namespace ActivityHashSalt {
    export type Interface = IActivityHashSalt;
}

export interface IActivityValueHasher {
    /** Hash of one value, for one target. */
    hash(value: unknown, target: ActivityTarget): string;
}

export const ActivityValueHasher =
    createAbstraction<IActivityValueHasher>("ActivityLog/ValueHasher");

export namespace ActivityValueHasher {
    export type Interface = IActivityValueHasher;
}
