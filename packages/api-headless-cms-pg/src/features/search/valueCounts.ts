import type { Knex } from "knex";
import type { CmsEntryUniqueValue } from "@webiny/api-headless-cms/types/index.js";

export interface IReadValueCountsParams {
    db: Knex;
    values: string;
    valueDeltas: string;
    scopeId: number;
    view: number;
    slot: string;
}

/**
 * Unique values of a text-list slot with their counts, from the maintained counts (see
 * createSchemaSql, valueCountsSql).
 *
 * First folds the slot's committed log rows into the counts: one reader at a time per slot (an
 * advisory lock; others skip the fold). The log rows of saves still in flight are not visible, so
 * they stay for the next fold. Then reads the counts plus the log rows left, in one statement (one
 * snapshot): exact whether or not the fold ran.
 */
export const readValueCounts = async (
    params: IReadValueCountsParams
): Promise<CmsEntryUniqueValue[]> => {
    const { db, values, valueDeltas, scopeId, view, slot } = params;
    const key = [scopeId, view, slot];
    const rows = await db.transaction(async trx => {
        const lock = await trx.raw("SELECT pg_try_advisory_xact_lock(hashtext(?)) AS locked", [
            `${values}:${scopeId}:${view}:${slot}`
        ]);
        if (lock.rows[0].locked) {
            await trx.raw(
                `WITH folded AS (
                    DELETE FROM "${valueDeltas}" WHERE scope_id = ? AND view = ? AND slot = ?
                    RETURNING value, delta
                 )
                 INSERT INTO "${values}" AS t (scope_id, view, slot, value, count)
                 SELECT ?, ?, ?, value, sum(delta)::int FROM folded
                 GROUP BY value HAVING sum(delta) <> 0 ORDER BY value
                 ON CONFLICT (scope_id, view, slot, value) DO UPDATE SET count = t.count + EXCLUDED.count`,
                [...key, ...key]
            );
            await trx.raw(
                `DELETE FROM "${values}" WHERE scope_id = ? AND view = ? AND slot = ? AND count <= 0`,
                key
            );
        }
        const result = await trx.raw(
            `SELECT value, sum(n)::int AS count FROM (
                SELECT value, count AS n FROM "${values}" WHERE scope_id = ? AND view = ? AND slot = ?
                UNION ALL
                SELECT value, delta FROM "${valueDeltas}" WHERE scope_id = ? AND view = ? AND slot = ?
             ) u
             GROUP BY value HAVING sum(n) > 0`,
            [...key, ...key]
        );
        return result.rows as CmsEntryUniqueValue[];
    });
    // As aggregateUniqueFieldValues: by value, then by count (most used first).
    return rows
        .sort((a, b) => (a.value > b.value ? 1 : b.value > a.value ? -1 : 0))
        .sort((a, b) => b.count - a.count);
};
