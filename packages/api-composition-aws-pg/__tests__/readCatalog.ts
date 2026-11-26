import type { Knex } from "knex";

/**
 * Every table, column, index, function and trigger in the database, sorted. Indexes, functions and
 * triggers come with their definitions, so a changed predicate or function body shows as a change.
 */
export const readCatalog = async (knex: Knex): Promise<string[]> => {
    const result = await knex.raw(`
        SELECT 'table ' || tablename AS item FROM pg_tables WHERE schemaname = 'public'
        UNION ALL
        SELECT 'column ' || table_name || '.' || column_name || ' ' || data_type
            FROM information_schema.columns WHERE table_schema = 'public'
        UNION ALL
        SELECT 'index ' || indexname || ' ' || indexdef FROM pg_indexes WHERE schemaname = 'public'
        UNION ALL
        SELECT 'function ' || p.proname || ' ' || pg_get_functiondef(p.oid) FROM pg_proc p
            JOIN pg_namespace n ON n.oid = p.pronamespace WHERE n.nspname = 'public'
        UNION ALL
        SELECT 'trigger ' || t.tgname || ' ' || pg_get_triggerdef(t.oid) FROM pg_trigger t
            JOIN pg_class c ON c.oid = t.tgrelid
            JOIN pg_namespace n ON n.oid = c.relnamespace
            WHERE n.nspname = 'public' AND NOT t.tgisinternal
    `);
    return result.rows.map((row: { item: string }) => row.item).sort();
};
