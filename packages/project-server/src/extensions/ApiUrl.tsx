import React from "react";
import { z } from "zod";
import { defineExtension, BuildParam } from "@webiny/project/extensions/index.js";

/**
 * Configure the self-hosted (server) flavour's own public API origin.
 *
 * Emitted as the API build parameter `WEBINY_API_URL`, read via `BuildParams` by api code that must
 * hand the client an absolute, reachable URL back to this API — e.g. the file-manager upload endpoint
 * and the file `srcPrefix`. It is a BUILD PARAM (not a `process.env` read in api runtime code): the
 * value is resolved once here, at build time, from whatever env the config chooses.
 *
 * AWS derives this from stack output (CloudFront domain) at deploy time; the self-hosted flavour has
 * no deploy step, so the origin is configured explicitly. Counterpart to `Admin.ApiUrl` (which points
 * the admin bundle at the API); this one tells the API its own origin.
 */
export const ApiUrl = defineExtension({
    type: "Infra/ApiUrl",
    tags: { runtimeContext: "project" },
    description: "Configure the server flavour's own public API origin.",
    paramsSchema: z.object({
        url: z
            .string()
            .describe("The API origin, e.g. https://api.example.com or http://localhost:3002.")
    }),
    render: props => {
        return <BuildParam paramName="WEBINY_API_URL" value={props.url.replace(/\/+$/, "")} />;
    }
});
