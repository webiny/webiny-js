import type { PgSchema } from "./abstractions.js";
import { SCALAR_FAMILIES, slotColumns } from "./slots.js";

const COLUMN_TYPES = {
    t: `text COLLATE "C"`,
    n: "numeric",
    b: "boolean",
    ta: "text[]",
    na: "numeric[]"
};

/**
 * DDL for the three tables. Statements are idempotent, so concurrent processes may run them.
 */
export const createSchemaSql = (tables: PgSchema.Tables): string[] => {
    const { entries, search, scopes } = tables;

    const slotDefinitions = (Object.keys(COLUMN_TYPES) as (keyof typeof COLUMN_TYPES)[])
        .flatMap(family => slotColumns(family).map(column => `${column} ${COLUMN_TYPES[family]}`))
        .join(",\n    ");

    const statements = [
        `CREATE TABLE IF NOT EXISTS "${entries}" (
    tenant       text NOT NULL,
    model_id     text NOT NULL,
    id           text COLLATE "C" NOT NULL,
    entry_id     text COLLATE "C" NOT NULL,
    version      integer NOT NULL,
    is_latest    boolean NOT NULL DEFAULT false,
    is_published boolean NOT NULL DEFAULT false,
    wby_deleted  boolean NOT NULL DEFAULT false,
    data         jsonb NOT NULL,
    PRIMARY KEY (tenant, model_id, id)
)`,
        `CREATE INDEX IF NOT EXISTS "${entries}_entry" ON "${entries}" (tenant, model_id, entry_id, version)`,
        `CREATE TABLE IF NOT EXISTS "${scopes}" (
    scope_id    serial PRIMARY KEY,
    tenant      text NOT NULL,
    model_id    text NOT NULL,
    slot_map    jsonb NOT NULL DEFAULT '{}',
    index_mode  text NOT NULL DEFAULT 'indexed',
    UNIQUE (tenant, model_id)
)`,
        /* Index modes (see indexMode.ts); tables created before them keep every scope indexed. */
        `ALTER TABLE "${scopes}" ADD COLUMN IF NOT EXISTS index_mode text NOT NULL DEFAULT 'indexed'`,
        /* View: 1 = latest, 2 = published, 3 = latest in the bin. */
        `CREATE TABLE IF NOT EXISTS "${search}" (
    scope_id  integer  NOT NULL,
    view      smallint NOT NULL,
    entry_id  text COLLATE "C" NOT NULL,
    id        text COLLATE "C" NOT NULL,
    ${slotDefinitions},
    sj        jsonb,
    ov        jsonb,
    tok       text[]   NOT NULL DEFAULT '{}',
    tsv       tsvector NOT NULL DEFAULT ''::tsvector,
    ix        boolean  NOT NULL DEFAULT true,
    PRIMARY KEY (scope_id, view, entry_id)
)`,
        `ALTER TABLE "${search}" ADD COLUMN IF NOT EXISTS ix boolean NOT NULL DEFAULT true`,
        /*
         * Every search index is partial on `ix`: rows of lean scopes are in none of them.
         * No pending list (fastupdate = off): a row's keys share its scope prefix, so a direct insert
         * touches a few adjacent leaves. A pending list mixes keys of many scopes, and the write that
         * fills it merges them into the whole tree, which took 7-14 s on a 25k-tenant Aurora database.
         */
        /*
         * Tokens and lexemes are prefixed by scope, so the default statistics (100 most common
         * elements) know almost none of them and the planner guesses. 10,000 keeps the common values
         * of big models, which picks the right index for a combined search and filter (19 ms
         * instead of 660 ms on a 1M-entry model). ANALYZE samples more rows in exchange.
         */
        `ALTER TABLE "${search}" ALTER COLUMN tok SET STATISTICS 10000, ALTER COLUMN tsv SET STATISTICS 10000`,
        /*
         * A model's rows: scope, view and `ix` are correlated (a scope's rows are all `ix` or none,
         * and every view holds the scope's entries), so the planner, multiplying their frequencies,
         * came out 4x low on a 1M-entry model, and every match estimate with it (estimateMatches).
         * Their combined frequencies (MCV) make it exact for big models: 961k for 980k rows.
         */
        `CREATE STATISTICS IF NOT EXISTS "${search}_scope" (mcv) ON scope_id, view, ix FROM "${search}"`,
        `ALTER STATISTICS "${search}_scope" SET STATISTICS 1000`,
        `CREATE INDEX IF NOT EXISTS "${search}_tok" ON "${search}" USING gin (tok) WITH (fastupdate = off) WHERE ix`,
        `CREATE INDEX IF NOT EXISTS "${search}_tsv" ON "${search}" USING gin (tsv) WITH (fastupdate = off) WHERE ix`
    ];

    statements.push(...valueCountsSql(tables));

    /*
     * One partial btree per scalar slot serves sort, ranges and prefix filters. Test runs recreate the
     * schema before every test, so they can skip these (WEBINY_PG_SLOT_INDEXES=false): they
     * affect speed, never results.
     */
    if (process.env.WEBINY_PG_SLOT_INDEXES === "false") {
        return statements;
    }
    for (const family of SCALAR_FAMILIES) {
        for (const column of slotColumns(family)) {
            statements.push(
                `CREATE INDEX IF NOT EXISTS "${search}_${column}" ON "${search}" (scope_id, view, ${column}, entry_id) WHERE ${column} IS NOT NULL AND ix`
            );
        }
    }

    return statements;
};

/*
 * Maintained counts of text-list values (e.g. file tags), so that listing a field's unique values
 * reads a few rows instead of every entry. Counts are kept per scope, view and slot, for indexed
 * rows (`ix`) only.
 *
 * Writers never update a count: statement-level triggers on the search table append the change of
 * each write to a log (-1 per value of a removed row, +1 per value of an inserted row). Log rows
 * have no key, so concurrent saves of entries with the same value don't wait on each other. A
 * count is the number of entries holding the value: a value repeated in one entry counts once. A
 * reader folds a slot's committed log rows into the counts (valueCounts.ts). The log rows belong to
 * the writing transaction: a rolled-back save leaves none.
 */
const valueCountsSql = (tables: PgSchema.Tables): string[] => {
    const { search, values, valueDeltas } = tables;
    const columns = slotColumns("ta");
    // Every text-list value of the rows in `rows`, with the number of rows holding it.
    const valuesOf = (
        rows: string
    ) => `SELECT r.scope_id, r.view, c.slot, v.value, count(*)::int AS n
        FROM ${rows} r
        CROSS JOIN LATERAL (VALUES ${columns.map(column => `('${column}', r.${column})`).join(", ")}) c(slot, arr)
        CROSS JOIN LATERAL (SELECT DISTINCT u FROM unnest(c.arr) u) v(value)
        WHERE r.ix AND c.arr IS NOT NULL AND v.value IS NOT NULL
        GROUP BY 1, 2, 3, 4`;
    const fn = `${search}_value_deltas_fn`;
    const truncateFn = `${search}_value_truncate_fn`;
    /*
     * Version 2 counts entries, not occurrences. A table with the version-1 triggers gets the new
     * ones and its counts rebuilt, by the block below that creates them.
     */
    const trigger = (name: string) => `"${search}_values2_${name}"`;
    const v1Triggers = ["ins", "del", "upd", "trunc"].map(name => `"${search}_values_${name}"`);
    return [
        `CREATE TABLE IF NOT EXISTS "${values}" (
    scope_id integer  NOT NULL,
    view     smallint NOT NULL,
    slot     text     NOT NULL,
    value    text COLLATE "C" NOT NULL,
    count    integer  NOT NULL,
    PRIMARY KEY (scope_id, view, slot, value)
)`,
        `CREATE TABLE IF NOT EXISTS "${valueDeltas}" (
    scope_id integer  NOT NULL,
    view     smallint NOT NULL,
    slot     text     NOT NULL,
    value    text COLLATE "C" NOT NULL,
    delta    integer  NOT NULL
)`,
        `CREATE INDEX IF NOT EXISTS "${valueDeltas}_slot" ON "${valueDeltas}" (scope_id, view, slot)`,
        `CREATE OR REPLACE FUNCTION "${fn}"() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
    IF TG_OP IN ('DELETE', 'UPDATE') THEN
        INSERT INTO "${valueDeltas}" (scope_id, view, slot, value, delta)
        SELECT scope_id, view, slot, value, -n FROM (${valuesOf("old_rows")}) d;
    END IF;
    IF TG_OP IN ('INSERT', 'UPDATE') THEN
        INSERT INTO "${valueDeltas}" (scope_id, view, slot, value, delta)
        SELECT scope_id, view, slot, value, n FROM (${valuesOf("new_rows")}) d;
    END IF;
    RETURN NULL;
END $$`,
        `CREATE OR REPLACE FUNCTION "${truncateFn}"() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
    TRUNCATE "${values}", "${valueDeltas}";
    RETURN NULL;
END $$`,
        /*
         * The triggers and the counts of the rows already there are created once, together. The
         * search table is locked against writes meanwhile, so no write falls between the two.
         */
        `DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_trigger WHERE tgrelid = '"${search}"'::regclass AND tgname = '${search}_values2_ins'
    ) THEN
        LOCK TABLE "${search}" IN SHARE ROW EXCLUSIVE MODE;
        ${v1Triggers.map(name => `DROP TRIGGER IF EXISTS ${name} ON "${search}";`).join("\n        ")}
        CREATE TRIGGER ${trigger("ins")} AFTER INSERT ON "${search}"
            REFERENCING NEW TABLE AS new_rows FOR EACH STATEMENT EXECUTE FUNCTION "${fn}"();
        CREATE TRIGGER ${trigger("del")} AFTER DELETE ON "${search}"
            REFERENCING OLD TABLE AS old_rows FOR EACH STATEMENT EXECUTE FUNCTION "${fn}"();
        CREATE TRIGGER ${trigger("upd")} AFTER UPDATE ON "${search}"
            REFERENCING OLD TABLE AS old_rows NEW TABLE AS new_rows FOR EACH STATEMENT EXECUTE FUNCTION "${fn}"();
        CREATE TRIGGER ${trigger("trunc")} AFTER TRUNCATE ON "${search}"
            FOR EACH STATEMENT EXECUTE FUNCTION "${truncateFn}"();
        DELETE FROM "${valueDeltas}";
        DELETE FROM "${values}";
        INSERT INTO "${values}" (scope_id, view, slot, value, count)
        SELECT scope_id, view, slot, value, n FROM (${valuesOf(`"${search}"`)}) d;
    END IF;
END $$`
    ];
};
