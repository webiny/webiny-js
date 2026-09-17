import type { Knex } from "knex";
import { createAbstraction } from "@webiny/feature/api";
import { TableManager } from "@webiny/api-core-sql/TableManager.js";
import type { StorageCredential } from "@webiny/self-hosted-auth";

const TABLE_NAME = "webiny_self_hosted_credentials";

export interface ICredentialRow {
    user_id: string;
    email: string;
    data: string;
}

export const toRow = (credential: StorageCredential): ICredentialRow => ({
    user_id: credential.userId,
    email: credential.email,
    data: JSON.stringify(credential)
});

export const toCredential = (row: ICredentialRow): StorageCredential => {
    return JSON.parse(row.data) as StorageCredential;
};

export interface ICredentialsTable {
    ensure(): Promise<void>;
    query(): Knex.QueryBuilder<ICredentialRow>;
}

/** The credentials table, shared by the four operations that read and write it. */
export const CredentialsTable = createAbstraction<ICredentialsTable>(
    "SelfHostedAuth/Sql/CredentialsTable"
);

export namespace CredentialsTable {
    export type Interface = ICredentialsTable;
    export type Row = ICredentialRow;
}

export class KnexCredentialsTable implements ICredentialsTable {
    constructor(
        private knex: Knex,
        private tableManager: TableManager
    ) {}

    async ensure(): Promise<void> {
        await this.tableManager.ensure(TABLE_NAME, t => {
            t.text("user_id").notNullable();
            t.text("email").notNullable();
            t.text("data").notNullable();

            t.primary(["user_id"]);
            // Email is the global login key.
            t.unique(["email"]);
        });
    }

    query(): Knex.QueryBuilder<ICredentialRow> {
        return this.knex<ICredentialRow>(this.tableManager.resolve(TABLE_NAME));
    }
}
