/**
 * Search indexes are per scope (one model of one tenant). Every search index is partial on the
 * row's `ix` flag, so a scope's rows cost index writes and space only while the scope is indexed.
 * Lean scopes are read through the primary key `(scope_id, view, …)`: filters, sorts and search
 * evaluate on the model's own rows, which is fast while the model is small.
 *
 * - `lean`: rows are written with `ix = false`, queries scan the model's rows.
 * - `promoting`: rows are written with `ix = true` while existing rows are flagged in batches;
 *   queries still scan, because not every row is flagged yet.
 * - `indexed`: every row has `ix = true`, queries add `ix` so the planner can use the indexes.
 * - `demoting`: queries stop adding `ix`; once every process has seen that, the scope becomes
 *   `lean` and its rows are unflagged.
 */
export type IndexMode = "lean" | "promoting" | "indexed" | "demoting";

export const INDEX_MODES: IndexMode[] = ["lean", "promoting", "indexed", "demoting"];

/**
 * Writes of a scope hold this lock shared from reading its mode until they commit; a mode change
 * takes it exclusively. Postgres queues lock requests, so a waiting change blocks new writes and
 * runs once the in-flight ones commit (a row lock would let a steady stream of writes starve it).
 * Bindings: the scopes table name and the scope id.
 */
export const MODE_LOCK_SHARED_SQL = "SELECT pg_advisory_xact_lock_shared(hashtext(?), ?)";
export const MODE_LOCK_SQL = "SELECT pg_advisory_xact_lock(hashtext(?), ?)";

/* The `ix` value of rows written in this mode. */
export const writesIx = (mode: IndexMode): boolean => mode !== "lean";

/* Whether queries may add `ix` (and so use the partial indexes) in this mode. */
export const readsIx = (mode: IndexMode): boolean => mode === "indexed";

/**
 * The mode of new scopes. A cluster for small accounts runs `lean` and promotes big models; a
 * cluster for large accounts runs `indexed`. Override with `WEBINY_PG_INDEX_MODE`.
 */
export const getDefaultIndexMode = (): "lean" | "indexed" => {
    return process.env.WEBINY_PG_INDEX_MODE === "lean" ? "lean" : "indexed";
};

/**
 * How long a process may use a cached scope mode for queries. Demotion waits longer than this
 * before unflagging rows, so no process still adds `ix` for the scope by then. Override with
 * `WEBINY_PG_INDEX_MODE_TTL_MS`.
 */
export const DEFAULT_MODE_TTL_MS = 30000;

export const getModeTtlMs = (): number => {
    const raw = Number(process.env.WEBINY_PG_INDEX_MODE_TTL_MS);
    return Number.isFinite(raw) && raw >= 0 && process.env.WEBINY_PG_INDEX_MODE_TTL_MS !== undefined
        ? raw
        : DEFAULT_MODE_TTL_MS;
};
