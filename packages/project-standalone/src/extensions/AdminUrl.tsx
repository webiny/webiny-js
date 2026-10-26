import React from "react";
import { z } from "zod";
import { defineExtension } from "@webiny/project/extensions/index.js";
import { EnvVar } from "@webiny/project/extensions/index.js";

/**
 * Configure the standalone hosting type's public Admin app URL.
 *
 * Sets the `WEBINY_ADMIN_URL` env var for `webiny watch` and `webiny serve`, which pass it to the API
 * server. The API reads it at startup (`readStandaloneConfig`) for `PublicUrls.getAdminUrl()`, which
 * the Next.js and Nuxt starter-kit configs hand to websites. A deployed container sets
 * `WEBINY_ADMIN_URL` itself.
 *
 * AWS writes the Admin URL to the service manifest when the Admin app is deployed. Counterpart to
 * `Infra.ApiUrl`.
 */
export const AdminUrl = defineExtension({
    type: "Infra/AdminUrl",
    tags: { runtimeContext: "project" },
    description: "Configure the standalone hosting type's public Admin app URL.",
    paramsSchema: z.object({
        url: z
            .string()
            .describe("The Admin app URL, e.g. https://admin.example.com or http://localhost:3001.")
    }),
    render: props => {
        return <EnvVar varName="WEBINY_ADMIN_URL" value={props.url.replace(/\/+$/, "")} />;
    }
});
