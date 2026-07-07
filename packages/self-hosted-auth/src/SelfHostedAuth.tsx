import React from "react";
import { z } from "zod";
import { defineExtension } from "@webiny/project/defineExtension/index.js";
import { AdminExtension, EnvVar, BuildParam } from "@webiny/project/extensions/index.js";

/**
 * Config-time extension rendered in `webiny.config.tsx` (like `Cognito`). It only wires things by
 * path/env/build-param — it does NOT import the admin app code, so `webiny.config.tsx` stays
 * lightweight. The API side (SelfHostedAuthApiFeature) is registered by the server flavour's
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
            )
    }),
    render: ({ signingSecret }) => {
        return (
            <>
                {/* JWT signing secret, read at runtime by TokenIssuer via BuildParams. */}
                <BuildParam paramName="SelfHostedAuthSigningSecret" value={signingSecret} />
                {/* Tells the install wizard's admin-user step which AppInstaller to target. */}
                <EnvVar varName="REACT_APP_AUTH_INSTALLER_APP_NAME" value="SelfHostedAuth" />
                {/* Admin login screen (loaded by path, not imported here). */}
                <AdminExtension src={import.meta.dirname + "/admin/Extension.js"} />
            </>
        );
    }
});
