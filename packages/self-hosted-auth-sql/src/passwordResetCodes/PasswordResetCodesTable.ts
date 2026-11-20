import type { Knex } from "knex";
import { createAbstraction } from "@webiny/feature/api";
import { KnexClient, SqlSchemaConfig } from "@webiny/api-core-sql";
import { TableManager } from "@webiny/api-core-sql/TableManager.js";
import { createTableManager } from "~/createTableManager.js";
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
    // A code with no hash yet is stored as an empty string. `code_hash` is NOT NULL, and making it
    // nullable would need a migration for every table that already exists.
    code_hash: code.codeHash ?? "",
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
    codeHash: row.code_hash || null,
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
 * place rather than in each of the seven.
 *
 * Built per request, on the container's connection and table settings (`SqlPasswordResetCodesTable`).
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

/** The reset codes table on the container's connection and table settings. */
class SqlPasswordResetCodesTableImpl
    extends KnexPasswordResetCodesTable
    implements PasswordResetCodesTable.Interface
{
    public constructor(knex: KnexClient.Interface, schemaConfig?: SqlSchemaConfig.Interface) {
        super(knex.client, createTableManager(knex, schemaConfig));
    }
}

export const SqlPasswordResetCodesTable = PasswordResetCodesTable.createImplementation({
    implementation: SqlPasswordResetCodesTableImpl,
    dependencies: [KnexClient, [SqlSchemaConfig, { optional: true }]]
});
