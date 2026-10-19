import type { Knex } from "knex";
import type {
    IKeyValueStorageOperations,
    IKeyValueStoreSetOptions
} from "@webiny/api-core/features/keyValueStore/abstractions.js";
import { WebinyError } from "@webiny/error";
import type { TableManager } from "~/TableManager.js";

const TABLE_NAME = "webiny_core_key_value";

interface IKeyValueRow {
    scopedKey: string;
    key: string;
    scope: string;
    value: string;
    expiresAt: Date | null;
}

interface CreateStorageOperationsParams {
    knex: Knex;
    tableManager: TableManager;
}

export const createStorageOperations = (
    params: CreateStorageOperationsParams
): IKeyValueStorageOperations => {
    const { knex, tableManager } = params;

    const ensureTable = () => {
        return tableManager.ensure(TABLE_NAME, table => {
            table.text("scopedKey").primary().notNullable();
            table.text("key").notNullable();
            table.text("scope").notNullable();
            table.text("value").notNullable();
            table.datetime("expiresAt");
        });
    };

    const query = () => {
        return knex<IKeyValueRow>(tableManager.resolve(TABLE_NAME));
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
                    await query().where("scopedKey", scopedKey).delete();
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

                await query().insert(row).onConflict("scopedKey").merge();
            } catch (err) {
                throw WebinyError.from(err, {
                    message: "Could not set key-value record.",
                    code: "SET_KEY_VALUE_ERROR",
                    data: { key, scope }
                });
            }
        },

        async list(prefix: string, scope: string) {
            await ensureTable();

            try {
                /*
                 * `substr` rather than `LIKE`: SQLite's LIKE ignores ASCII case, and both would treat
                 * `%` and `_` in the prefix as wildcards. Both dialects count characters (code
                 * points), hence the spread rather than `prefix.length`.
                 */
                const rows = await query()
                    .where("scope", scope)
                    .whereRaw("substr(??, 1, ?) = ?", ["key", [...prefix].length, prefix]);

                const now = new Date();

                return (
                    rows
                        .filter(row => !row.expiresAt || new Date(row.expiresAt) > now)
                        // Sorted here, not in SQL: a database collation can order keys differently
                        // from DynamoDB, which compares them byte by byte.
                        .sort((a, b) => (a.key < b.key ? -1 : a.key > b.key ? 1 : 0))
                        .map(row => ({ key: row.key, value: JSON.parse(row.value) }))
                );
            } catch (err) {
                throw WebinyError.from(err, {
                    message: "Could not list key-value records.",
                    code: "LIST_KEY_VALUE_ERROR",
                    data: { prefix, scope }
                });
            }
        },

        async delete(key: string, scope: string) {
            await ensureTable();

            try {
                const scopedKey = createScopedKey(key, scope);
                await query().where("scopedKey", scopedKey).delete();
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
