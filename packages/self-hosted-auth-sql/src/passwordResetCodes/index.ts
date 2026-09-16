import type { Knex } from "knex";
import WebinyError from "@webiny/error";
import { TableManager } from "@webiny/api-core-sql/TableManager.js";
import type {
    PasswordResetCodeStorageOperations,
    StoredPasswordResetCode
} from "@webiny/self-hosted-auth";

const TABLE_NAME = "webiny_self_hosted_password_reset_codes";

interface IPasswordResetCodeRow {
    id: string;
    email: string;
    code_hash: string;
    created_on: string;
    expires_on: string;
    used_on: string | null;
    attempts: number;
}

const toRow = (code: StoredPasswordResetCode): IPasswordResetCodeRow => ({
    id: code.id,
    email: code.email,
    code_hash: code.codeHash,
    created_on: code.createdOn,
    expires_on: code.expiresOn,
    used_on: code.usedOn,
    attempts: code.attempts
});

/*
 * Columns rather than a JSON blob, unlike the credentials table. Every field here is queried:
 * the address and the creation time by the request limit, the expiry and the used marker by the
 * lookup, and the attempt count is incremented in place. A blob would mean reading rows to count
 * them.
 */
const toCode = (row: IPasswordResetCodeRow): StoredPasswordResetCode => ({
    id: row.id,
    email: row.email,
    codeHash: row.code_hash,
    createdOn: row.created_on,
    expiresOn: row.expires_on,
    usedOn: row.used_on,
    attempts: Number(row.attempts)
});

interface CreateStorageOperationsParams {
    knex: Knex;
    tableNamePrefix?: string;
}

export const createStorageOperations = (
    params: CreateStorageOperationsParams
): PasswordResetCodeStorageOperations.Interface => {
    const { knex } = params;

    const tableManager = new TableManager(knex, params.tableNamePrefix);

    const ensureTable = () =>
        tableManager.ensure(TABLE_NAME, t => {
            t.text("id").notNullable();
            t.text("email").notNullable();
            t.text("code_hash").notNullable();
            t.text("created_on").notNullable();
            t.text("expires_on").notNullable();
            t.text("used_on").nullable();
            t.integer("attempts").notNullable().defaultTo(0);

            t.primary(["id"]);
            // Every read is "the codes for this address", and the request limit adds a time bound.
            t.index(["email", "created_on"]);
        });

    const query = () => knex<IPasswordResetCodeRow>(tableManager.resolve(TABLE_NAME));

    return {
        async saveCode({ code }) {
            await ensureTable();
            try {
                await query().insert(toRow(code));
            } catch (err) {
                throw WebinyError.from(err, {
                    message: "Could not save password reset code.",
                    code: "SAVE_PASSWORD_RESET_CODE_ERROR"
                });
            }
        },

        async listLiveCodesByEmail({ email, now }) {
            await ensureTable();
            try {
                const rows = await query()
                    .where("email", email)
                    .whereNull("used_on")
                    .where("expires_on", ">", now)
                    .orderBy("created_on", "desc");

                return rows.map(toCode);
            } catch (err) {
                throw WebinyError.from(err, {
                    message: "Could not load password reset codes.",
                    code: "LIST_PASSWORD_RESET_CODES_ERROR"
                });
            }
        },

        async countCodesCreatedSince({ email, since }) {
            await ensureTable();
            try {
                const result = await query()
                    .where("email", email)
                    .where("created_on", ">=", since)
                    .count({ total: "*" })
                    .first();

                return Number(result?.total ?? 0);
            } catch (err) {
                throw WebinyError.from(err, {
                    message: "Could not count password reset codes.",
                    code: "COUNT_PASSWORD_RESET_CODES_ERROR"
                });
            }
        },

        async incrementAttempts({ id }) {
            await ensureTable();
            try {
                // Incremented in the database rather than read, added to, and written back, so that
                // two guesses arriving at once cannot both spend the same attempt.
                await query().where("id", id).increment("attempts", 1);
            } catch (err) {
                throw WebinyError.from(err, {
                    message: "Could not record a password reset code attempt.",
                    code: "INCREMENT_PASSWORD_RESET_CODE_ATTEMPTS_ERROR"
                });
            }
        },

        async markCodesUsedForEmail({ email, usedOn }) {
            await ensureTable();
            try {
                await query().where("email", email).whereNull("used_on").update({
                    used_on: usedOn
                });
            } catch (err) {
                throw WebinyError.from(err, {
                    message: "Could not mark password reset codes as used.",
                    code: "MARK_PASSWORD_RESET_CODES_USED_ERROR"
                });
            }
        },

        async deleteCodesExpiredBefore({ before }) {
            await ensureTable();
            try {
                await query().where("expires_on", "<", before).delete();
            } catch (err) {
                throw WebinyError.from(err, {
                    message: "Could not delete expired password reset codes.",
                    code: "DELETE_PASSWORD_RESET_CODES_ERROR"
                });
            }
        }
    };
};
