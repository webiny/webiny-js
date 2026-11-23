import { randomInt } from "node:crypto";

/*
 * A run id for the names of everything a test file creates. The time alone is not enough: files run
 * in parallel workers and two of them can start in the same millisecond, which made two files ask
 * for the same group slug. Digits only, so the id is valid inside a model id and a slug.
 */
export const createRunId = (): string => {
    const suffix = String(randomInt(0, 1_000_000)).padStart(6, "0");
    return `${Date.now()}${suffix}`;
};
