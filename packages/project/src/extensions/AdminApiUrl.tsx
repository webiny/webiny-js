import React from "react";
import { z } from "zod";
import { defineExtension } from "~/defineExtension/index.js";
import { EnvVar } from "./EnvVar.js";

/**
 * Sets the URL the Admin app talks to, baked into the admin bundle as `WEBINY_ADMIN_API_URL`
 * (the admin runtime reads it, else falls back to same-origin). Because the config is evaluated
 * at build time, the value can come from any env var the user chooses, e.g.
 * `<Admin.ApiUrl url={process.env.MY_API_URL} />`.
 */
export const AdminApiUrl = defineExtension({
    type: "Admin/ApiUrl",
    tags: { runtimeContext: "project" },
    description: "Set the API URL the Admin app talks to.",
    paramsSchema: z.object({
        url: z
            .string()
            .describe("The API origin, e.g. https://api.example.com or http://localhost:3000")
    }),
    render: props => {
        return <EnvVar varName="WEBINY_ADMIN_API_URL" value={props.url} />;
    }
});
