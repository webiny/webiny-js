import type { Knex } from "knex";
import type {
    IKeyValueStorageOperations,
    IKeyValueStoreSetOptions
} from "@webiny/api-core/features/keyValueStore/abstractions.js";
import { WebinyError } from "@webiny/error";
import type { TableManager } from "~/TableManager.js";

const TABLE_NAME = "webiny_core_key_value";
/*
 * Which collection each listable record belongs to. A table of its own because `ensure` only creates
 * tables, so an existing key-value table cannot gain a column, and because a record in no collection,
 * like most of them, then costs nothing here.
 */
const COLLECTION_TABLE_NAME = "webiny_core_key_value_collection";

interface IKeyValueRow {
    scopedKey: string;
    key: string;
    scope: string;
    value: string;
    expiresAt: Date | null;
}

interface IKeyValueCollectionRow {
    scopedKey: string;
    scope: string;
    collection: string;
    key: string;
}

interface CreateStorageOperationsParams {
    knex: Knex;
    tableManager: TableManager;
}

export const createStorageOperations = (
    params: CreateStorageOperationsParams
): IKeyValueStorageOperations => {
    const { knex, tableManager } = params;

    const ensureTable = async () => {
        await tableManager.ensure(TABLE_NAME, table => {
            table.text("scopedKey").primary().notNullable();
            table.text("key").notNullable();
            table.text("scope").notNullable();
            table.text("value").notNullable();
            table.datetime("expiresAt");
        });
        await tableManager.ensure(COLLECTION_TABLE_NAME, table => {
            table.text("scopedKey").primary().notNullable();
            table.text("scope").notNullable();
            table.text("collection").notNullable();
            table.text("key").notNullable();
            table.index(["scope", "collection"]);
        });
    };

    const query = (trx: Knex = knex) => {
        return trx<IKeyValueRow>(tableManager.resolve(TABLE_NAME));
    };

    const collectionQuery = (trx: Knex = knex) => {
        return trx<IKeyValueCollectionRow>(tableManager.resolve(COLLECTION_TABLE_NAME));
    };

    /*
     * The key compared byte by byte, as DynamoDB compares sort keys, so both stores page in the same
     * order. SQLite compares text that way already. Postgres uses the database's collation, which can
     * be a locale that ignores case and punctuation, unless told to use "C".
     */
    const binaryKey = (column: string): string => {
        return knex.client.dialect === "postgresql" ? `${column} COLLATE "C"` : column;
    };

    const createScopedKey = (key: string, scope: string): string => {
        return `${scope}:${key}`;
    };

    return {
        async get(key: string, scope: string) {
            await ensureTable();

            try {
                const scopedKey = createScopedKey(key, scope);
                const row = await query().where("scopedKey", scopedKey).first();

                if (!row) {
                    return null;
                }

                if (row.expiresAt && new Date(row.expiresAt) <= new Date()) {
                    await knex.transaction(async trx => {
                        await query(trx).where("scopedKey", scopedKey).delete();
                        await collectionQuery(trx).where("scopedKey", scopedKey).delete();
                    });
                    return null;
                }

                return {
                    key,
                    value: JSON.parse(row.value)
                };
            } catch (err) {
                throw WebinyError.from(err, {
                    message: "Could not get key-value record.",
                    code: "GET_KEY_VALUE_ERROR",
                    data: { key, scope }
                });
            }
        },

        async set(key: string, value: any, scope: string, options?: IKeyValueStoreSetOptions) {
            await ensureTable();

            try {
                const scopedKey = createScopedKey(key, scope);
                const expiresAt = options?.expiresAt ?? null;

                const row: IKeyValueRow = {
                    scopedKey,
                    key,
                    scope,
                    value: JSON.stringify(value),
                    expiresAt
                };

                const collection = options?.collection;

                // Like DynamoDB's put, a write without a collection takes the record out of the one
                // it was in, so both stores agree on what `list` returns.
                await knex.transaction(async trx => {
                    await query(trx).insert(row).onConflict("scopedKey").merge();

                    if (collection) {
                        await collectionQuery(trx)
                            .insert({ scopedKey, scope, collection, key })
                            .onConflict("scopedKey")
                            .merge();
                    } else {
                        await collectionQuery(trx).where("scopedKey", scopedKey).delete();
                    }
                });
            } catch (err) {
                throw WebinyError.from(err, {
                    message: "Could not set key-value record.",
                    code: "SET_KEY_VALUE_ERROR",
                    data: { key, scope }
                });
            }
        },

        async list({ collection, scope, limit, reverse, after }) {
            await ensureTable();

            try {
                const builder = knex
                    .from({ c: tableManager.resolve(COLLECTION_TABLE_NAME) })
                    .join({ kv: tableManager.resolve(TABLE_NAME) }, "kv.scopedKey", "c.scopedKey")
                    .where("c.scope", scope)
                    .where("c.collection", collection)
                    .select("kv.key", "kv.value", "kv.expiresAt");

                const orderedKey = binaryKey(`"c"."key"`);
                if (after !== undefined) {
                    builder.whereRaw(`${orderedKey} ${reverse ? "<" : ">"} ?`, [after]);
                }

                // One extra row tells whether another page exists without a second, empty read.
                const rows: Pick<IKeyValueRow, "key" | "value" | "expiresAt">[] = await builder
                    .orderByRaw(`${orderedKey} ${reverse ? "DESC" : "ASC"}`)
                    .limit(limit + 1);
                const page = rows.slice(0, limit);
                const now = new Date();

                return {
                    items: page
                        .filter(row => !row.expiresAt || new Date(row.expiresAt) > now)
                        .map(row => ({ key: row.key, value: JSON.parse(row.value) })),
                    lastKey: rows.length > limit ? page[page.length - 1].key : null
                };
            } catch (err) {
                throw WebinyError.from(err, {
                    message: "Could not list key-value records.",
                    code: "LIST_KEY_VALUE_ERROR",
                    data: { collection, scope, after }
                });
            }
        },

        async delete(key: string, scope: string) {
            await ensureTable();

            try {
                const scopedKey = createScopedKey(key, scope);
                await knex.transaction(async trx => {
                    await query(trx).where("scopedKey", scopedKey).delete();
                    await collectionQuery(trx).where("scopedKey", scopedKey).delete();
                });
            } catch (err) {
                throw WebinyError.from(err, {
                    message: "Could not delete key-value record.",
                    code: "DELETE_KEY_VALUE_ERROR",
                    data: { key, scope }
                });
            }
        }
    };
};
