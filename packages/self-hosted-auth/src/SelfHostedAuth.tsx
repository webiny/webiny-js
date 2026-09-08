import React from "react";
import { z } from "zod";
import { defineExtension } from "@webiny/project/defineExtension/index.js";
import { AdminExtension, EnvVar, BuildParam } from "@webiny/project/extensions/index.js";
import { CliCommand } from "@webiny/cli-core/extensions/index.js";
import {
    CLI_PASSWORD_RESET_BUILD_PARAM,
    SIGNING_SECRET_BUILD_PARAM
} from "./shared/buildParams.js";

/**
 * Config-time extension rendered in `webiny.config.tsx` (like `Cognito`). It only wires things by
 * path/env/build-param — it does NOT import the admin app code, so `webiny.config.tsx` stays
 * lightweight. The API side (SelfHostedAuthApiFeature) is registered by the server hosting type's
 * request handler; it reads the signing secret from the `SelfHostedAuthSigningSecret` build param.
 */
export const SelfHostedAuth = defineExtension({
    type: "Project/SelfHostedAuth",
    tags: { runtimeContext: "project" },
    description: "Enable the self-hosted identity provider (login screen + JWT auth).",
    paramsSchema: z.object({
        signingSecret: z
            .string()
            .min(1)
            .describe(
                "JWT signing secret (HS256) used to mint and verify login tokens. Keep it stable and " +
                    "shared across all API instances; changing it invalidates every outstanding session. " +
                    "Back it with any env var, e.g. signingSecret={process.env.MY_AUTH_SECRET}."
            ),
        tokenExpiresIn: z
            .number()
            .int()
            .positive()
            .optional()
            .describe("Login token lifetime in seconds. Defaults to 43200 (12 hours)."),
        cliPasswordReset: z
            .boolean()
            .optional()
            .describe(
                "Whether `webiny reset-password` and the mutation behind it are available. On by " +
                    "default. Set to false to drop both the command and the mutation, leaving the " +
                    "admin UI as the only way to change a password."
            )
    }),
    render: ({ signingSecret, tokenExpiresIn, cliPasswordReset }) => {
        const cliPasswordResetEnabled = cliPasswordReset !== false;

        return (
            <>
                {/* JWT signing secret, read at runtime by TokenIssuer via BuildParams. */}
                <BuildParam paramName={SIGNING_SECRET_BUILD_PARAM} value={signingSecret} />
                {tokenExpiresIn && (
                    <BuildParam paramName="SelfHostedAuthTokenExpiresIn" value={tokenExpiresIn} />
                )}
                {/* Read by the CLI reset schema factory, which adds no mutation when disabled. */}
                <BuildParam
                    paramName={CLI_PASSWORD_RESET_BUILD_PARAM}
                    value={cliPasswordResetEnabled}
                />
                {/* Lockout escape hatch: `webiny reset-password <email>`. Loaded by path, like the
                    admin extension below, so webiny.config.tsx pulls in no CLI code itself. */}
                {cliPasswordResetEnabled && (
                    <CliCommand src={import.meta.dirname + "/cli/ResetPasswordCommand.js"} />
                )}
                {/* Tells the install wizard's admin-user step which AppInstaller to target. */}
                <EnvVar varName="REACT_APP_AUTH_INSTALLER_APP_NAME" value="SelfHostedAuth" />
                {/* Admin login screen (loaded by path, not imported here). */}
                <AdminExtension src={import.meta.dirname + "/admin/Extension.js"} />
            </>
        );
    }
});
