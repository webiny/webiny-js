import React from "react";
import { z } from "zod";
import { defineExtension } from "@webiny/project/extensions/index.js";
import { EnvVar } from "@webiny/project/extensions/index.js";

/**
 * Configure the standalone hosting type's public API URL.
 *
 * Sets the `WEBINY_API_URL` env var for `webiny watch` and `webiny serve`, which pass it to the API
 * server. The API reads it at startup (`readStandaloneConfig`) for the file upload URLs, the file
 * `srcPrefix` and `PublicUrls.getApiUrl()`. Nothing is baked into the build: a deployed container
 * sets `WEBINY_API_URL` itself, so one build runs on any domain.
 *
 * AWS gets this from the service manifest at deploy time. Counterpart to `Admin.ApiUrl`, which points
 * the admin bundle at the API; this one tells the API its own URL.
 */
export const ApiUrl = defineExtension({
    type: "Infra/ApiUrl",
    tags: { runtimeContext: "project" },
    description: "Configure the standalone hosting type's public API URL.",
    paramsSchema: z.object({
        url: z
            .string()
            .describe("The API URL, e.g. https://api.example.com or http://localhost:3002.")
    }),
    render: props => {
        return <EnvVar varName="WEBINY_API_URL" value={props.url.replace(/\/+$/, "")} />;
    }
});
