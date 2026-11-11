import { createFeature } from "@webiny/feature/api";
import { CredentialsSqlFeature } from "./credentials/index.js";
import { PasswordResetCodesSqlFeature } from "./passwordResetCodes/index.js";
import { SelfHostedAuthSchemaSetup } from "./SelfHostedAuthSchemaSetup.js";

/**
 * Registers the SQL implementations of the self-hosted auth storage operations: four for
 * credentials, six for the codes the self-service password reset emails. Register this alongside
 * `SelfHostedAuthApiFeature`, which consumes the abstractions.
 *
 * It runs on the connection (`KnexClient`) and the table settings (`SqlSchemaConfig`: prefix and
 * schema-managed) in the container, which the SQL storage keeps in the root. The standalone server
 * registers it per request.
 *
 * It also registers the `selfHostedAuth` schema setup step, which creates both tables.
 */
export const SelfHostedAuthSqlFeature = createFeature({
    name: "SelfHostedAuthSql",
    register(container) {
        CredentialsSqlFeature.register(container);
        PasswordResetCodesSqlFeature.register(container);

        container.register(SelfHostedAuthSchemaSetup);
    }
});
