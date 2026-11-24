/**
 * Per-process cache of the row estimates estimateMatches asks for (planner estimates and counts up
 * to a limit), keyed by statement and bindings.
 *
 * The estimates only pick how a filtered list is read and whether it is counted, and the planner's
 * own figures change only when Postgres refreshes the table statistics, so a short-lived copy
 * gives the same choices without the statements: a list request ran about 2.3 of them, a quarter
 * of its database time (pgLambda benchmark).
 *
 * `PgStorageConfig.estimateTtlMs` sets how long an estimate is kept (default 60 s, 0 turns the
 * cache off). At most MAX_ENTRIES are kept; the oldest go first.
 */
const MAX_ENTRIES = 2_000;

interface IEntry {
    value: Promise<number>;
    expiresAt: number;
}

const entries = new Map<string, IEntry>();

/*
 * The cached estimate for `key`, or `compute()`'s. Concurrent callers share one computation; a
 * failed one is not kept.
 */
export const cachedEstimate = (
    key: string,
    ttl: number,
    compute: () => Promise<number>
): Promise<number> => {
    if (ttl === 0) {
        return compute();
    }
    const now = Date.now();
    const cached = entries.get(key);
    if (cached && cached.expiresAt > now) {
        return cached.value;
    }
    entries.delete(key);
    const value = compute();
    entries.set(key, { value, expiresAt: now + ttl });
    value.catch(() => {
        if (entries.get(key)?.value === value) {
            entries.delete(key);
        }
    });
    if (entries.size > MAX_ENTRIES) {
        // Maps iterate in insertion order: the first key is the oldest.
        entries.delete(entries.keys().next().value!);
    }
    return value;
};

export const clearEstimateCache = (): void => {
    entries.clear();
};
