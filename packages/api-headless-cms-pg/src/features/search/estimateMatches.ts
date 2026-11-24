import type { Knex } from "knex";
import { SqlFragment } from "./SqlFragment.js";
import { cachedEstimate } from "./estimateCache.js";

export interface IEstimateMatchesParams {
    db: Knex;
    search: string;
    /* Scope, view and `ix` (an indexed scope). */
    base: SqlFragment[];
    /* The list's conditions, ANDed. */
    conditions: SqlFragment[];
    /* Estimating stops once the estimate is at most this many rows. */
    limit: number;
    /* How long an estimate is cached (PgStorageConfig.estimateTtlMs); 0: not cached. */
    ttlMs: number;
}

export interface IMatchesEstimate {
    rows: number;
    /*
     * The most selective condition estimated is answered by a scope-prefixed GIN index (`scoped`):
     * reading the matches should start from it, not from a slot index.
     */
    selectiveScoped: boolean;
}

/* The planner's row estimate for `filter` (planning only, no rows read). */
const plannerRows = (
    db: Knex,
    search: string,
    filter: SqlFragment,
    ttlMs: number
): Promise<number> => {
    const sql = `EXPLAIN (FORMAT JSON) SELECT 1 FROM "${search}" WHERE ${filter.sql}`;
    const bindings = filter.rawBindings();
    return cachedEstimate(`${sql}\u0000${JSON.stringify(bindings)}`, ttlMs, async () => {
        const result = await db.raw(sql, bindings);
        const plan = result.rows[0]["QUERY PLAN"];
        return (typeof plan === "string" ? JSON.parse(plan) : plan)[0].Plan["Plan Rows"];
    });
};

/* Cheapest to estimate first: plain predicates, then ranges and groups, full-text last (slowest to plan). */
const costOf = (fragment: SqlFragment): number => {
    if (fragment.estimate?.kind === "range" || fragment.estimate?.kind === "or") {
        return 1;
    }
    return fragment.sql.includes("tsv @@") ? 2 : 0;
};

/**
 * Estimates how many rows of one model match a list's conditions.
 *
 * The planner estimates a single condition well (token and lexeme statistics), but not a
 * combination: tokens and lexemes are prefixed by scope, so all conditions of a list are correlated
 * through the model, and the planner, which treats them as independent across the whole shared
 * table, comes out low by the model's share of the table for every condition added. So each
 * condition is estimated on its own as a share of the model's rows, and the shares are combined
 * within the model (AND: product, OR: 1 - product of complements).
 */
export const estimateMatches = async (
    params: IEstimateMatchesParams
): Promise<IMatchesEstimate> => {
    const { db, search, base, conditions, limit, ttlMs } = params;
    const baseFilter = SqlFragment.join(base, " AND ");
    // Accurate with the scope statistics (createSchemaSql): scope, view and `ix` are correlated.
    const modelRows = Math.max(1, await plannerRows(db, search, baseFilter, ttlMs));
    // The scope's rows in all views (planned once, when a scoped predicate needs it).
    let scopeRowsPlanned: Promise<number> | null = null;
    const scopeRows = (): Promise<number> => {
        scopeRowsPlanned ??= plannerRows(
            db,
            search,
            SqlFragment.join(
                base.filter(condition => !condition.sql.startsWith("view ")),
                " AND "
            ),
            ttlMs
        ).then(rows => Math.max(1, rows));
        return scopeRowsPlanned;
    };
    // The model's rows matching `fragment`, counted up to the limit.
    const countUpTo = (fragment: SqlFragment): Promise<number> => {
        const filter = SqlFragment.join([...base, fragment], " AND ");
        const sql = `SELECT count(*)::int AS n FROM (SELECT 1 FROM "${search}" WHERE ${filter.sql} LIMIT ${limit}) t`;
        const bindings = filter.rawBindings();
        return cachedEstimate(`${sql}\u0000${JSON.stringify(bindings)}`, ttlMs, async () => {
            const counted = await db.raw(sql, bindings);
            return counted.rows[0].n;
        });
    };

    const shareOf = async (fragment: SqlFragment): Promise<number> => {
        const estimate = fragment.estimate;
        if (estimate?.kind === "and" || estimate?.kind === "or") {
            const shares: number[] = [];
            for (const part of estimate.parts) {
                shares.push(await shareOf(part));
            }
            return estimate.kind === "and"
                ? shares.reduce((product, share) => product * share, 1)
                : 1 - shares.reduce((product, share) => product * (1 - share), 1);
        }
        if (estimate?.kind === "share") {
            return estimate.share;
        }
        if (estimate?.kind === "range") {
            /*
             * The column's statistics mix every model's values, so they can't tell this model's
             * share. Count the model's index entries in the range, up to the limit (an index-only
             * scan); at the limit, count those outside it (NULLs are in neither). When both reach
             * the limit, the share is somewhere between limit / modelRows and 1 - limit / modelRows:
             * take the middle.
             */
            const matching = await countUpTo(fragment);
            if (matching < limit) {
                return matching / modelRows;
            }
            const others = await countUpTo(fragment.wrap("NOT (", ")"));
            if (others < limit) {
                return Math.min(1, Math.max(limit, modelRows - others) / modelRows);
            }
            return 0.5;
        }
        const target = estimate?.kind === "planner" ? estimate.fragment : fragment;
        if (estimate?.kind === "atMost") {
            const filter = SqlFragment.join([...base, target], " AND ");
            const rows = Math.min(estimate.rows, await plannerRows(db, search, filter, ttlMs));
            return Math.min(1, rows / modelRows);
        }
        if (target.scoped) {
            /*
             * A scoped predicate's keys belong to the model alone, so it is estimated without the
             * base conditions, which the planner would multiply in as if independent (`ix` alone
             * took a quarter off). Its keys are in every view of the model: its share is of the
             * scope's rows in all views.
             */
            return Math.min(
                1,
                (await plannerRows(db, search, target, ttlMs)) / (await scopeRows())
            );
        }
        const filter = SqlFragment.join([...base, target], " AND ");
        return Math.min(1, (await plannerRows(db, search, filter, ttlMs)) / modelRows);
    };

    // Top-level ANDed parts, so that estimating can stop early.
    const parts = conditions
        .flatMap(condition =>
            condition.estimate?.kind === "and" ? condition.estimate.parts : [condition]
        )
        .sort((a, b) => costOf(a) - costOf(b));

    let rows = modelRows;
    let best = { share: 2, scoped: false };
    for (const part of parts) {
        const share = await shareOf(part);
        if (share < best.share) {
            best = { share, scoped: part.scoped };
        }
        rows *= share;
        // ANDed parts only lower the estimate: at the limit the list is counted, the rest is not needed.
        if (rows <= limit) {
            break;
        }
    }
    return { rows: Math.round(rows), selectiveScoped: best.scoped };
};
