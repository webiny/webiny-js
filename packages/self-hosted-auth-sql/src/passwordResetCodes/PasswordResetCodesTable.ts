import type { Knex } from "knex";
import { createAbstraction } from "@webiny/feature/api";
import { TableManager } from "@webiny/api-core-sql/TableManager.js";
import type { StoredPasswordResetCode } from "@webiny/self-hosted-auth";

const TABLE_NAME = "webiny_self_hosted_password_reset_codes";

export interface IPasswordResetCodeRow {
    id: string;
    email: string;
    code_hash: string;
    created_on: string;
    expires_on: string;
    used_on: string | null;
    attempts: number;
}

export const toRow = (code: StoredPasswordResetCode): IPasswordResetCodeRow => ({
    id: code.id,
    email: code.email,
    code_hash: code.codeHash,
    created_on: code.createdOn,
    expires_on: code.expiresOn,
    used_on: code.usedOn,
    attempts: code.attempts
});

/*
 * Columns rather than a JSON blob, unlike the credentials table. Every field here is queried: the
 * address and the creation time by the request limit, the expiry and the used marker by the lookup,
 * and the attempt count is incremented in place. A blob would mean reading rows to count them.
 */
export const toCode = (row: IPasswordResetCodeRow): StoredPasswordResetCode => ({
    id: row.id,
    email: row.email,
    codeHash: row.code_hash,
    createdOn: row.created_on,
    expiresOn: row.expires_on,
    usedOn: row.used_on,
    attempts: Number(row.attempts)
});

export interface IPasswordResetCodesTable {
    /** Creates the table if it is not there yet. Every operation calls this before touching it. */
    ensure(): Promise<void>;
    query(): Knex.QueryBuilder<IPasswordResetCodeRow>;
}

/**
 * The table the reset code operations share: the schema, the prefixing and the lazy create, in one
 * place rather than in each of the six.
 *
 * It is also why they share a single `TableManager`. That class caches which tables it has verified
 * per instance and registers itself in a global list, so one per operation would mean six existence
 * checks per container and six entries in that list.
 */
export const PasswordResetCodesTable = createAbstraction<IPasswordResetCodesTable>(
    "SelfHostedAuth/Sql/PasswordResetCodesTable"
);

export namespace PasswordResetCodesTable {
    export type Interface = IPasswordResetCodesTable;
    export type Row = IPasswordResetCodeRow;
}

export class KnexPasswordResetCodesTable implements IPasswordResetCodesTable {
    constructor(
        private knex: Knex,
        private tableManager: TableManager
    ) {}

    async ensure(): Promise<void> {
        await this.tableManager.ensure(TABLE_NAME, t => {
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
    }

    query(): Knex.QueryBuilder<IPasswordResetCodeRow> {
        return this.knex<IPasswordResetCodeRow>(this.tableManager.resolve(TABLE_NAME));
    }
}
