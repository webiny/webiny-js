import { createFeature } from "@webiny/feature/api";
import type { Knex } from "knex";
import { TableManager } from "@webiny/api-core-sql/TableManager.js";
import { CredentialsTable } from "./CredentialsTable.js";
import { KnexCredentialsTable } from "./CredentialsTable.js";
import { SqlGetCredentialByEmail } from "./SqlGetCredentialByEmail.js";
import { SqlGetCredentialByUserId } from "./SqlGetCredentialByUserId.js";
import { SqlSaveCredential } from "./SqlSaveCredential.js";
import { SqlDeleteCredential } from "./SqlDeleteCredential.js";

export interface CredentialsSqlConfig {
    knex: Knex;
    tableManager: TableManager;
}

export const CredentialsSqlFeature = createFeature<CredentialsSqlConfig>({
    name: "SelfHostedAuthCredentialsSql",
    register(container, { knex, tableManager }) {
        container.registerInstance(CredentialsTable, new KnexCredentialsTable(knex, tableManager));

        container.register(SqlGetCredentialByEmail);
        container.register(SqlGetCredentialByUserId);
        container.register(SqlSaveCredential);
        container.register(SqlDeleteCredential);
    }
});
