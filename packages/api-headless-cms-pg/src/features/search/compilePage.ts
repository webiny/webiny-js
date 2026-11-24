import type { ISortSpec } from "./compileSort.js";
import { SqlFragment } from "./SqlFragment.js";

export interface ICursor {
    v: string | null;
    id: string;
}

export interface ICompilePageParams {
    search: string;
    /* The list conditions, without the cursor. */
    filter: SqlFragment;
    sort: ISortSpec;
    cursor: ICursor | null;
    limit: number;
    /*
     * Null token of the sort slot for an unfiltered list of an indexed scope (see indexedPage),
     * null otherwise. A filtered list keeps the plain query: the planner picks the filter's index,
     * while walking the sort index with a filter would read most of the scope for a rare value.
     */
    nullToken: string | null;
    /*
     * The scope has at most the count cap of NULL rows for the sort slot. They are then read through
     * their token (GIN) and sorted; otherwise by walking the primary key, which finds many NULL rows
     * quickly but reads the whole scope when there are none (the planner can't tell the two apart).
     */
    fewNulls?: boolean;
    /*
     * Walk the sort index for a filtered list: read at most `budget` rows of the scope in sort order
     * and test `conditions` on them (`filter` then holds only the scope conditions). Fewer than
     * `limit` rows back means the budget ran out (or the list ended).
     */
    walk?: { conditions: SqlFragment; budget: number };
}

/* Keyset condition: rows strictly after (value, entry_id) in the sort order, NULLs included. */
const afterCursor = (sort: ISortSpec, cursor: ICursor): SqlFragment => {
    const { column, cast } = sort;
    if (sort.descending) {
        if (cursor.v === null) {
            return new SqlFragment(
                `((${column} IS NULL AND entry_id < ?) OR ${column} IS NOT NULL)`,
                [cursor.id]
            );
        }
        return new SqlFragment(
            `(${column} < ?${cast} OR (${column} = ?${cast} AND entry_id < ?))`,
            [cursor.v, cursor.v, cursor.id]
        );
    }
    if (cursor.v === null) {
        return new SqlFragment(`(${column} IS NULL AND entry_id > ?)`, [cursor.id]);
    }
    return new SqlFragment(
        `(${column} > ?${cast} OR (${column} = ?${cast} AND entry_id > ?) OR ${column} IS NULL)`,
        [cursor.v, cursor.v, cursor.id]
    );
};

/**
 * The page of an indexed scope sorted by a slot. The slot indexes are partial on `IS NOT NULL`, so a
 * plain `ORDER BY slot` cannot use them and reads every row of the scope. The page is read in two
 * branches instead: non-NULL rows in index order, and NULL rows found through their null token. The
 * outer ORDER BY puts NULLs where Postgres would (first for DESC, last for ASC). Each branch takes
 * the cursor as a row comparison, so it starts at the cursor instead of skipping rows before it.
 */
const indexedPage = (params: ICompilePageParams & { slot: string; nullToken: string }) => {
    const { search, filter, sort, cursor, limit, slot, nullToken, fewNulls, walk } = params;
    const direction = sort.descending ? "DESC" : "ASC";
    const after = sort.descending ? "<" : ">";
    const branches: SqlFragment[] = [];
    // DESC lists NULLs first, so a cursor on a value is past all of them; ASC lists them last, so a
    // cursor on a NULL is past all values.
    const nullsDone = cursor !== null && cursor.v !== null && sort.descending;
    const valuesDone = cursor !== null && cursor.v === null && !sort.descending;
    if (!nullsDone) {
        const conditions = [filter, SqlFragment.textArray([nullToken]).wrap("tok @> ", "")];
        if (walk) {
            // CASE hides the list conditions, so the planner reads the NULL rows by their token.
            conditions.push(walk.conditions.wrap("CASE WHEN ", " THEN TRUE ELSE FALSE END"));
        }
        if (cursor && cursor.v === null) {
            conditions.push(new SqlFragment(`entry_id ${after} ?`, [cursor.id]));
        }
        // OFFSET 0 keeps the ORDER BY out of the inner query, so it reads the token's GIN postings.
        branches.push(
            SqlFragment.join(conditions, " AND ").wrap(
                fewNulls
                    ? `(SELECT * FROM (SELECT entry_id, id, ${slot} AS sort_key FROM "${search}" WHERE `
                    : `(SELECT entry_id, id, ${slot} AS sort_key FROM "${search}" WHERE `,
                fewNulls
                    ? ` OFFSET 0) nulls ORDER BY entry_id ${direction} LIMIT ${limit})`
                    : ` ORDER BY entry_id ${direction} LIMIT ${limit})`
            )
        );
    }
    if (!valuesDone) {
        const conditions = [filter, new SqlFragment(`${slot} IS NOT NULL`)];
        if (cursor && cursor.v !== null) {
            conditions.push(
                new SqlFragment(`(${slot}, entry_id) ${after} (?${sort.cast}, ?)`, [
                    cursor.v,
                    cursor.id
                ])
            );
        }
        const order = `ORDER BY ${slot} ${direction}, entry_id ${direction}`;
        if (walk) {
            // The inner LIMIT bounds the rows read; conditions are not pushed into a LIMIT subquery.
            branches.push(
                SqlFragment.join(
                    [
                        SqlFragment.join(conditions, " AND ").wrap(
                            `(SELECT entry_id, id, sort_key FROM (SELECT *, ${slot} AS sort_key FROM "${search}" WHERE `,
                            ` ${order} LIMIT ${walk.budget}) w WHERE `
                        ),
                        walk.conditions.wrap(
                            "",
                            ` ORDER BY sort_key ${direction}, entry_id ${direction} LIMIT ${limit})`
                        )
                    ],
                    ""
                )
            );
        } else {
            branches.push(
                SqlFragment.join(conditions, " AND ").wrap(
                    `(SELECT entry_id, id, ${slot} AS sort_key FROM "${search}" WHERE `,
                    ` ${order} LIMIT ${limit})`
                )
            );
        }
    }
    return SqlFragment.join(branches, " UNION ALL ").wrap(
        "SELECT entry_id, id, sort_key::text AS sort_value FROM (",
        `) page ORDER BY sort_key ${direction}, entry_id ${direction} LIMIT ${limit}`
    );
};

/**
 * The total of an unfiltered list, counted up to `cap + 1` rows (see EntrySearch: totals are exact
 * up to the cap). `ix` is not in the primary key, so a plain count of an indexed scope reads every
 * row from the heap; with a sort slot it counts index-only instead: the rows in the slot's partial
 * index plus the NULL rows through their token.
 */
export const compileCount = (
    params: Omit<ICompilePageParams, "cursor" | "limit"> & { cap: number }
): SqlFragment => {
    const { search, filter, sort, nullToken, cap } = params;
    const upTo = (conditions: SqlFragment) =>
        conditions.wrap(
            `(SELECT count(*) FROM (SELECT 1 FROM "${search}" WHERE `,
            ` LIMIT ${cap + 1}) c)`
        );
    if (!sort.slot || !nullToken) {
        return upTo(filter).wrap("SELECT ", "::int AS total");
    }
    const values = upTo(
        SqlFragment.join([filter, new SqlFragment(`${sort.slot} IS NOT NULL`)], " AND ")
    );
    return SqlFragment.join(
        [values, compileNullCount({ search, filter, nullToken, cap })],
        " AS v_count, "
    ).wrap(
        // OFFSET 0: otherwise the subquery is pulled up and n_count, used twice, is counted twice.
        "SELECT (v_count + n_count)::int AS total, n_count::int AS nulls FROM (SELECT ",
        " OFFSET 0) c"
    );
};

/*
 * NULL rows of the sort slot, counted through their token up to `cap + 1` (as `n_count`). The token
 * belongs to the scope, so the scope conditions are hidden from the planner (CASE): otherwise it ANDs
 * the primary key's bitmap of the whole scope with the token's (1.3 s instead of 0.4 s for 2.5M NULL
 * rows of a 5M-entry model). `ix` stays visible: the GIN index is partial on it.
 */
export const compileNullCount = (params: {
    search: string;
    filter: SqlFragment;
    nullToken: string;
    cap: number;
}): SqlFragment =>
    SqlFragment.join(
        [
            params.filter.wrap("CASE WHEN ", " THEN TRUE ELSE FALSE END"),
            new SqlFragment("ix"),
            SqlFragment.textArray([params.nullToken]).wrap("tok @> ", "")
        ],
        " AND "
    ).wrap(
        // The inner query is planned without the LIMIT, so it reads the token's postings (GIN).
        `(SELECT count(*) FROM (SELECT 1 FROM (SELECT 1 FROM "${params.search}" WHERE `,
        ` OFFSET 0) t LIMIT ${params.cap + 1}) c) AS n_count`
    );

/**
 * A filtered list's total and first page in one statement, for lists with at most `cap` matches.
 * Matches are collected through the search indexes (the caller turns off plain index and
 * sequential scans), at most `cap + 1` of them, then sorted. Every row carries `total`, the number
 * of matches up to `cap + 1`; above `cap` the page is incomplete and the caller reads it by
 * walking the sort index instead. Without matches past the cursor, one row with a NULL entry_id.
 */
export const compileMatchedPage = (
    params: Omit<ICompilePageParams, "nullToken"> & { cap: number }
): SqlFragment => {
    const { search, filter, sort, cursor, limit, cap } = params;
    const direction = sort.descending ? "DESC" : "ASC";
    const column = sort.slot || sort.column;
    const matches = filter.wrap(
        `WITH m AS MATERIALIZED (SELECT entry_id, id, ${column} AS sort_key FROM "${search}" WHERE `,
        ` LIMIT ${cap + 1})`
    );
    const after = cursor
        ? afterCursor({ ...sort, column: "sort_key" }, cursor).wrap(" WHERE ", "")
        : new SqlFragment("");
    const page = after.wrap(
        "SELECT entry_id, id, sort_key::text AS sort_value FROM m",
        ` ORDER BY sort_key ${direction}, entry_id ${direction} LIMIT ${limit}`
    );
    return SqlFragment.join(
        [
            matches,
            page.wrap(
                " SELECT c.total, p.entry_id, p.id, p.sort_value FROM (SELECT count(*)::int AS total FROM m) c LEFT JOIN (",
                ") p ON TRUE"
            )
        ],
        ""
    );
};

/* One page of a list: entry_id, id and the sort value as text, `limit` rows at most. */
export const compilePage = (params: ICompilePageParams): SqlFragment => {
    const { search, filter, sort, cursor, limit, nullToken } = params;
    if (sort.slot && nullToken) {
        return indexedPage({ ...params, slot: sort.slot, nullToken });
    }
    // A lean scope (or an overflow sort) has no index to use; it reads the scope's rows either way.
    const conditions = cursor ? [filter, afterCursor(sort, cursor)] : [filter];
    const direction = sort.descending ? "DESC" : "ASC";
    return SqlFragment.join(conditions, " AND ").wrap(
        `SELECT entry_id, id, ${sort.column}::text AS sort_value FROM "${search}" WHERE `,
        ` ORDER BY ${sort.column} ${direction}, entry_id ${direction} LIMIT ${limit}`
    );
};
