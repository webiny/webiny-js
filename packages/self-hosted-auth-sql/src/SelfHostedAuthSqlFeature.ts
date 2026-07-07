import { createFeature } from "@webiny/feature/api";
import type { Knex } from "knex";
import { CredentialsStorageOperations } from "@webiny/self-hosted-auth";
import { createStorageOperations } from "./credentials/index.js";

export interface SelfHostedAuthSqlConfig {
    knex: Knex;
    tableNamePrefix?: string;
}

/**
 * Registers the SQL implementation of `CredentialsStorageOperations`. Register
 * this alongside `SelfHostedAuthApiFeature`, which consumes the abstraction.
 */
export const SelfHostedAuthSqlFeature = createFeature<SelfHostedAuthSqlConfig>({
    name: "SelfHostedAuthSql",
    register(container, { knex, tableNamePrefix }) {
        container.registerInstance(
            CredentialsStorageOperations,
            createStorageOperations({ knex, tableNamePrefix })
        );
    }
});
