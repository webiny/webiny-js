import React from "react";
import { z } from "zod";
import { defineExtension } from "@webiny/project/defineExtension/index.js";
import { AdminExtension, EnvVar } from "@webiny/project/extensions/index.js";

/**
 * Config-time extension rendered in `webiny.config.tsx` (like `Cognito`). It only wires things by
 * path/env — it does NOT import the admin app code, so `webiny.config.tsx` stays lightweight.
 * The API side (SelfHostedAuthApiFeature) is registered by the server flavour's request handler.
 */
export const SelfHostedAuth = defineExtension({
    type: "Project/SelfHostedAuth",
    tags: { runtimeContext: "project" },
    description: "Enable the self-hosted identity provider (login screen + JWT auth).",
    paramsSchema: z.object({}),
    render: () => {
        return (
            <>
                {/* Tells the install wizard's admin-user step which AppInstaller to target. */}
                <EnvVar varName="REACT_APP_AUTH_INSTALLER_APP_NAME" value="SelfHostedAuth" />
                {/* Admin login screen (loaded by path, not imported here). */}
                <AdminExtension src={import.meta.dirname + "/admin/Extension.js"} />
            </>
        );
    }
});
