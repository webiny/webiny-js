import WebinyError from "@webiny/error";
import type { Database } from "@webiny/db-sqlite";
import { deleteRow, getRow, upsertRow } from "../utils/row.js";

interface KeyValueRecord {
    key: string;
    value: unknown;
    scope: string;
}

export class KeyValueStoreStorageOperations {
    private readonly db: Database;

    public constructor(db: Database) {
        this.db = db;
    }

    private createKey(key: string, scope: string): { pk: string; sk: string } {
        return { pk: `KV#${scope}:${key}`, sk: "A" };
    }

    public async get(key: string, scope: string): Promise<KeyValueRecord | null> {
        try {
            const data = await getRow<KeyValueRecord>(this.db, this.createKey(key, scope));
            if (!data) {
                return null;
            }
            return { key: data.key, value: data.value, scope: data.scope };
        } catch (err) {
            throw WebinyError.from(err, {
                message: "Could not get key-value record.",
                code: "GET_KEY_VALUE_ERROR",
                data: { key, scope }
            });
        }
    }

    public async set(key: string, value: unknown, scope: string): Promise<void> {
        try {
            await upsertRow(this.db, this.createKey(key, scope), { key, value, scope });
        } catch (err) {
            throw WebinyError.from(err, {
                message: "Could not set key-value record.",
                code: "SET_KEY_VALUE_ERROR",
                data: { key, scope }
            });
        }
    }

    public async delete(key: string, scope: string): Promise<void> {
        try {
            await deleteRow(this.db, this.createKey(key, scope));
        } catch (err) {
            throw WebinyError.from(err, {
                message: "Could not delete key-value record.",
                code: "DELETE_KEY_VALUE_ERROR",
                data: { key, scope }
            });
        }
    }
}
