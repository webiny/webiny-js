import type { Knex } from "knex";
import WebinyError from "@webiny/error";
import { TableManager } from "@webiny/api-core-sql/TableManager.js";
import type { CredentialsStorageOperations, StorageCredential } from "@webiny/self-hosted-auth";

const TABLE_NAME = "webiny_self_hosted_credentials";

interface ICredentialRow {
    user_id: string;
    email: string;
    data: string;
}

const toRow = (c: StorageCredential): ICredentialRow => ({
    user_id: c.userId,
    email: c.email,
    data: JSON.stringify(c)
});

const toCredential = (row: ICredentialRow): StorageCredential =>
    JSON.parse(row.data) as StorageCredential;

interface CreateStorageOperationsParams {
    knex: Knex;
    tableNamePrefix?: string;
}

export const createStorageOperations = (
    params: CreateStorageOperationsParams
): CredentialsStorageOperations.Interface => {
    const { knex } = params;

    // Reuse api-core-sql's shared TableManager (prefixing + lazy ensure + global reset()) instead of
    // a local copy, so credential tables stay consistent with the rest of the SQL storage.
    const tableManager = new TableManager(knex, params.tableNamePrefix);

    const ensureTable = () =>
        tableManager.ensure(TABLE_NAME, t => {
            t.text("user_id").notNullable();
            t.text("email").notNullable();
            t.text("data").notNullable();

            t.primary(["user_id"]);
            // Email is the global login key.
            t.unique(["email"]);
        });

    const query = () => knex<ICredentialRow>(tableManager.resolve(TABLE_NAME));

    return {
        async getCredentialByEmail({ email }) {
            await ensureTable();
            try {
                const row = await query().where("email", email).first();
                return row ? toCredential(row) : null;
            } catch (err) {
                throw WebinyError.from(err, {
                    message: "Could not load credential by email.",
                    code: "GET_CREDENTIAL_BY_EMAIL_ERROR"
                });
            }
        },

        async getCredentialByUserId({ userId }) {
            await ensureTable();
            try {
                const row = await query().where("user_id", userId).first();
                return row ? toCredential(row) : null;
            } catch (err) {
                throw WebinyError.from(err, {
                    message: "Could not load credential by user id.",
                    code: "GET_CREDENTIAL_BY_USER_ID_ERROR",
                    data: { userId }
                });
            }
        },

        async saveCredential({ credential }) {
            await ensureTable();
            try {
                const row = toRow(credential);
                await query()
                    .insert(row)
                    .onConflict(["user_id"])
                    .merge({ email: row.email, data: row.data });
            } catch (err) {
                throw WebinyError.from(err, {
                    message: "Could not save credential.",
                    code: "SAVE_CREDENTIAL_ERROR",
                    data: { userId: credential.userId }
                });
            }
        },

        async deleteCredential({ userId }) {
            await ensureTable();
            try {
                await query().where("user_id", userId).delete();
            } catch (err) {
                throw WebinyError.from(err, {
                    message: "Could not delete credential.",
                    code: "DELETE_CREDENTIAL_ERROR",
                    data: { userId }
                });
            }
        }
    };
};
