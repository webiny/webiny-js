import React from "react";
import { z } from "zod";
import { defineExtension, BuildParam } from "@webiny/project/extensions/index.js";

/**
 * Configure the standalone hosting type's public Admin app origin.
 *
 * Emitted as the API build parameter `WEBINY_ADMIN_URL` and read through `PublicUrls.getAdminUrl()`
 * by api code that hands the Admin URL to someone else, e.g. the Next.js and Nuxt starter-kit
 * configs (`WEBINY_ADMIN_HOST`, used by the website for live preview).
 *
 * AWS writes the Admin URL to the service manifest when the Admin app is deployed; the standalone
 * hosting type has no deploy step, and the Admin app may be served from anywhere, so the origin is
 * configured explicitly. Counterpart to `Infra.ApiUrl`.
 *
 * The baked value is a default. At run time the `WEBINY_ADMIN_URL` env var replaces it
 * (`RuntimeEnvBuildParamsDecorator` in `@webiny/api-event-handler-standalone`), so one build can run on
 * any domain.
 */
export const AdminUrl = defineExtension({
    type: "Infra/AdminUrl",
    tags: { runtimeContext: "project" },
    description: "Configure the standalone hosting type's public Admin app origin.",
    paramsSchema: z.object({
        url: z
            .string()
            .describe(
                "The Admin app origin, e.g. https://admin.example.com or http://localhost:3001."
            )
    }),
    render: props => {
        return <BuildParam paramName="WEBINY_ADMIN_URL" value={props.url.replace(/\/+$/, "")} />;
    }
});
