import type { Knex } from "knex";
import type { ISortSpec } from "./compileSort.js";
import type { ICursor } from "./compilePage.js";
import { compileCount, compileMatchedPage, compileNullCount, compilePage } from "./compilePage.js";
import { SqlFragment } from "./SqlFragment.js";
import { estimateMatches } from "./estimateMatches.js";

/*
 * Totals are exact up to this many matches; above it a list reports the cap. It also picks the plan
 * of a filtered list: up to the cap, matches are read through the search indexes and sorted; above
 * it, the sort index is walked.
 */
export const DEFAULT_COUNT_CAP = 10000;

/*
 * A filtered list estimated to match more than this many times the cap is not counted: it is read
 * by walking the sort index and its total is reported as the cap. Below it, the matches are
 * collected up to the cap (exact total, or the cap when more match).
 */
const SKIP_COUNT_FACTOR = 2;

export const getCountCap = (): number => {
    const value = Number(process.env.WEBINY_PG_COUNT_CAP);
    return Number.isInteger(value) && value > 0 ? value : DEFAULT_COUNT_CAP;
};

/*
 * Collecting a filtered list's matches must read the search indexes (GIN and slot bitmaps). Search
 * lexemes and tokens are prefixed by scope, so Postgres has no statistics for most of them and
 * guesses; with a wrong guess it scans the model's rows instead, and reads all of them for a rare
 * term.
 */
const BITMAP_ONLY =
    "SET LOCAL enable_seqscan = off; SET LOCAL enable_indexscan = off; SET LOCAL enable_indexonlyscan = off";

/*
 * `WEBINY_PG_BITMAP_HINTS=false` leaves the planner settings alone. RDS Proxy pins a client
 * to its database connection for the rest of the session after any SET, SET LOCAL included, so
 * behind a proxy the hints cost multiplexing (POC switch, to measure that against the plans).
 */
const useBitmapHints = (): boolean => process.env.WEBINY_PG_BITMAP_HINTS !== "false";

export interface IPageRow {
    entry_id: string;
    id: string;
    sort_value: string | null;
}

export interface IReadListPageParams {
    db: Knex;
    search: string;
    /* Scope, view and `ix`: the conditions every search index starts with. */
    base: SqlFragment[];
    /* The list's own conditions (where, search box); empty for an unfiltered list. */
    conditions: SqlFragment[];
    sort: ISortSpec;
    cursor: ICursor | null;
    /* Rows to read: the page size plus one, to tell whether more items follow. */
    limit: number;
    /* Null token of the sort slot of an indexed scope, null otherwise (see compilePage). */
    nullToken: string | null;
    cap: number;
}

export interface IListPage {
    /* Matches up to the cap; the cap itself when more match (or are estimated to). */
    totalCount: number;
    rows: IPageRow[];
    /* How the page was read, for benchmarks and logs. */
    plan: "unfiltered" | "matched" | "walk" | "sorted";
    /* False when the total comes from the estimate (more than SKIP_COUNT_FACTOR × cap). */
    counted: boolean;
}

const readPage = async (db: Knex, query: SqlFragment): Promise<IPageRow[]> => {
    const result = await db.raw(query.sql, query.rawBindings());
    return result.rows;
};

/*
 * A query that collects matches through the search indexes: with the hints, in a transaction of its
 * own (SET LOCAL lasts until its end); without them, a plain statement, which saves the BEGIN and
 * COMMIT round trips.
 */
const readWithHints = async <TRow>(db: Knex, query: SqlFragment): Promise<TRow[]> => {
    if (!useBitmapHints()) {
        return (await db.raw(query.sql, query.rawBindings())).rows;
    }
    return db.transaction(async trx => {
        await trx.raw(BITMAP_ONLY);
        return (await trx.raw(query.sql, query.rawBindings())).rows;
    });
};

/**
 * Reads one page of a list and its total.
 *
 * - Unfiltered: counts up to the cap and reads the page in sort order (through the slot index on
 *   an indexed scope).
 * - Filtered, estimated to match more than SKIP_COUNT_FACTOR × cap (estimateMatches): not counted;
 *   the page is read by walking the sort index, and the total is the cap.
 * - Filtered otherwise: collects up to `cap + 1` matches through the search indexes, in the same
 *   statement as the page (sorted in memory). Above the cap that page is incomplete, so it is read
 *   again by walking the sort index.
 */
export const readListPage = async (params: IReadListPageParams): Promise<IListPage> => {
    const { db, search, base, conditions, sort, cursor, limit, nullToken, cap } = params;
    const filter = SqlFragment.join([...base, ...conditions], " AND ");

    if (conditions.length === 0) {
        // The count runs without the cursor condition, so it is the total of the whole result set.
        const countQuery = compileCount({ search, filter, sort, nullToken, cap });
        const counted: { total: number; nulls?: number } = (
            await db.raw(countQuery.sql, countQuery.rawBindings())
        ).rows[0];
        const fewNulls = counted.nulls !== undefined && counted.nulls <= cap;
        return {
            totalCount: Math.min(counted.total, cap),
            rows: await readPage(
                db,
                compilePage({ search, filter, sort, cursor, limit, nullToken, fewNulls })
            ),
            plan: "unfiltered",
            counted: true
        };
    }

    const indexed = base.some(condition => condition.sql === "ix");
    let selectiveScoped = false;
    if (indexed && nullToken) {
        const threshold = SKIP_COUNT_FACTOR * cap;
        const estimate = await estimateMatches({ db, search, base, conditions, limit: threshold });
        if (estimate.rows > threshold) {
            const page = await readWithoutCount(params);
            // A first page that is not full holds the whole result: its total is known.
            const complete = !cursor && page.rows.length < limit;
            return {
                totalCount: complete ? page.rows.length : cap,
                rows: page.rows,
                plan: page.plan,
                counted: complete
            };
        }
        selectiveScoped = estimate.selectiveScoped;
    }

    /*
     * When the matches are best found through a scope-prefixed GIN index (every condition is one,
     * or the most selective one is), the scope conditions are hidden from the planner: otherwise it
     * ANDs the primary key's bitmap of the whole scope with the GIN bitmaps (75 ms on a 1M-entry
     * model) because it can't tell they're already scoped. When the most selective condition is a
     * slot range, the scope stays: the slot index needs it.
     */
    // `ix` stays visible: the GIN indexes are partial on it. A lean scope (no `ix`) has no GIN rows.
    const scopeOnly = base.filter(condition => condition.sql !== "ix");
    const hideScope =
        indexed && (selectiveScoped || conditions.every(condition => condition.scoped));
    const matchedFilter = hideScope
        ? SqlFragment.join(
              [
                  SqlFragment.join(scopeOnly, " AND ").wrap(
                      "CASE WHEN ",
                      " THEN TRUE ELSE FALSE END"
                  ),
                  new SqlFragment("ix"),
                  ...conditions
              ],
              " AND "
          )
        : filter;
    const matchedQuery = compileMatchedPage({
        search,
        filter: matchedFilter,
        sort,
        cursor,
        limit,
        cap
    });
    const matched = await readWithHints<IPageRow & { total: number }>(db, matchedQuery);
    const total = matched.length > 0 ? matched[0].total : 0;
    if (total <= cap) {
        return {
            totalCount: total,
            rows: matched.filter(row => row.entry_id !== null),
            plan: "matched",
            counted: true
        };
    }
    const page = await readWithoutCount(params);
    return { totalCount: cap, rows: page.rows, plan: page.plan, counted: true };
};

/* Rows of the sort index a walk reads per row of the page, and the most it reads in all. */
const WALK_ROWS_PER_PAGE_ROW = 500;
const MAX_WALK_FACTOR = 10;

/*
 * How far to walk the sort index for a page of `limit` rows: far enough to fill it when at least one
 * row in WALK_ROWS_PER_PAGE_ROW matches, and never less than `cap` rows. A fixed budget fills a page
 * of 20 but not one of 100 (the default page size), and the fallback, sorting every match, takes
 * seconds on a model of millions (round 9 of the benchmark).
 */
export const walkBudget = (limit: number, cap: number): number =>
    Math.min(Math.max(cap, limit * WALK_ROWS_PER_PAGE_ROW), MAX_WALK_FACTOR * cap);

/*
 * The page alone: walk the sort index testing each row (walkBudget), which fills a page quickly
 * when many rows match; when the walk doesn't fill it (the matches sit far along the sort order, or
 * the list ends), sort all matches through the search indexes instead.
 */
const readWithoutCount = async (
    params: IReadListPageParams
): Promise<{ rows: IPageRow[]; plan: "walk" | "sorted" }> => {
    const { db, search, base, conditions, sort, cursor, limit, nullToken, cap } = params;
    const filter = SqlFragment.join([...base, ...conditions], " AND ");
    if (!nullToken) {
        // No sort index to walk (lean scope or overflow sort): the plain query.
        return {
            rows: await readPage(
                db,
                compilePage({ search, filter, sort, cursor, limit, nullToken })
            ),
            plan: "walk"
        };
    }
    // NULL rows of the whole scope (a superset of the matching ones) decide how they are read.
    const nullCount = compileNullCount({
        search,
        filter: SqlFragment.join(base, " AND "),
        nullToken,
        cap
    }).wrap("SELECT ", "");
    const fewNulls = (await db.raw(nullCount.sql, nullCount.rawBindings())).rows[0].n_count <= cap;
    const walked = await readPage(
        db,
        compilePage({
            search,
            filter: SqlFragment.join(base, " AND "),
            sort,
            cursor,
            limit,
            nullToken,
            fewNulls,
            walk: {
                conditions: SqlFragment.join(conditions, " AND "),
                budget: walkBudget(limit, cap)
            }
        })
    );
    if (walked.length >= limit) {
        return { rows: walked, plan: "walk" };
    }
    const sorted = compilePage({ search, filter, sort, cursor, limit, nullToken: null });
    return { rows: await readWithHints<IPageRow>(db, sorted), plan: "sorted" };
};
