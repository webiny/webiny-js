import { createFeature } from "@webiny/feature/api";
import type { Knex } from "knex";
import { TableManager } from "@webiny/api-core-sql/TableManager.js";
import { CredentialsSqlFeature } from "./credentials/index.js";
import { PasswordResetCodesSqlFeature } from "./passwordResetCodes/index.js";

export interface SelfHostedAuthSqlConfig {
    knex: Knex;
    tableNamePrefix?: string;
}

/**
 * Registers the SQL implementations of the self-hosted auth storage operations: four for
 * credentials, six for the codes the self-service password reset emails. Register this alongside
 * `SelfHostedAuthApiFeature`, which consumes the abstractions.
 *
 * One `TableManager` for both tables. It caches which tables it has verified per instance and
 * registers itself in a global list, so one per operation would mean ten existence checks per
 * container and ten entries in that list.
 */
export const SelfHostedAuthSqlFeature = createFeature<SelfHostedAuthSqlConfig>({
    name: "SelfHostedAuthSql",
    register(container, { knex, tableNamePrefix }) {
        const tableManager = new TableManager(knex, tableNamePrefix);

        CredentialsSqlFeature.register(container, { knex, tableManager });
        PasswordResetCodesSqlFeature.register(container, { knex, tableManager });
    }
});
