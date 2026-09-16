import { createFeature } from "@webiny/feature/api";
import type { Knex } from "knex";
import { CredentialsStorageOperations } from "@webiny/self-hosted-auth";
import { PasswordResetCodeStorageOperations } from "@webiny/self-hosted-auth";
import { createStorageOperations } from "./credentials/index.js";
import { createStorageOperations as createPasswordResetCodeStorageOperations } from "./passwordResetCodes/index.js";

export interface SelfHostedAuthSqlConfig {
    knex: Knex;
    tableNamePrefix?: string;
}

/**
 * Registers the SQL implementations of the self-hosted auth storage seams: credentials, and the
 * codes emailed by the self-service password reset. Register this alongside
 * `SelfHostedAuthApiFeature`, which consumes both abstractions.
 *
 * Two tables, because the two have nothing to do with each other beyond an address: a credential
 * lives as long as the account, a reset code lives for fifteen minutes.
 */
export const SelfHostedAuthSqlFeature = createFeature<SelfHostedAuthSqlConfig>({
    name: "SelfHostedAuthSql",
    register(container, { knex, tableNamePrefix }) {
        container.registerInstance(
            CredentialsStorageOperations,
            createStorageOperations({ knex, tableNamePrefix })
        );

        container.registerInstance(
            PasswordResetCodeStorageOperations,
            createPasswordResetCodeStorageOperations({ knex, tableNamePrefix })
        );
    }
});
