import type { Knex } from "knex";

const keys = new WeakMap<object, string>();
let next = 0;

/**
 * A short id for the database a Knex instance connects to, for keys of the process's schema memory
 * (`getSchemaMemory`). A transaction shares its connection's config, so it gets its connection's id:
 * what setup learns in a transaction is what the connection knows afterwards. Two Knex instances
 * built separately get different ids, even for the same database.
 */
export function getConnectionKey(knex: Knex): string {
    const identity: object = knex.client?.config ?? knex;
    let key = keys.get(identity);
    if (!key) {
        next += 1;
        key = `db${next}`;
        keys.set(identity, key);
    }
    return key;
}
