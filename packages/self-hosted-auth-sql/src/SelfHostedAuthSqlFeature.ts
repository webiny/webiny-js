import { createFeature } from "@webiny/feature/api";
import type { Knex } from "knex";
import { TableManager } from "@webiny/api-core-sql/TableManager.js";
import { CredentialsSqlFeature } from "./credentials/index.js";
import { PasswordResetCodesSqlFeature } from "./passwordResetCodes/index.js";
import { SelfHostedAuthSchemaSetup } from "./SelfHostedAuthSchemaSetup.js";

export interface SelfHostedAuthSqlConfig {
    knex: Knex;
    tableNamePrefix?: string;
    /**
     * The tables were set up before the server took traffic (the `selfHostedAuth` schema setup step
     * ran), so they are never checked for or created at runtime. Off by default: each is created on
     * first use.
     */
    schemaManaged?: boolean;
}

/**
 * Registers the SQL implementations of the self-hosted auth storage operations: four for
 * credentials, six for the codes the self-service password reset emails. Register this alongside
 * `SelfHostedAuthApiFeature`, which consumes the abstractions.
 *
 * One `TableManager` for both tables. It caches which tables it has verified per instance and
 * registers itself in a global list, so one per operation would mean ten existence checks per
 * container and ten entries in that list.
 *
 * It also registers the `selfHostedAuth` schema setup step, which creates both tables. Run it where
 * the feature isn't schema-managed (the storage's setup container).
 */
export const SelfHostedAuthSqlFeature = createFeature<SelfHostedAuthSqlConfig>({
    name: "SelfHostedAuthSql",
    register(container, { knex, tableNamePrefix, schemaManaged }) {
        const tableManager = new TableManager(knex, tableNamePrefix, { schemaManaged });

        CredentialsSqlFeature.register(container, { knex, tableManager });
        PasswordResetCodesSqlFeature.register(container, { knex, tableManager });

        container.register(SelfHostedAuthSchemaSetup);
    }
});
