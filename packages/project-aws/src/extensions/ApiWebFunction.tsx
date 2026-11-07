import React from "react";
import { z } from "zod";
import { defineExtension } from "@webiny/project/defineExtension/index.js";
import { EnvVar } from "@webiny/project/extensions/index.js";

/**
 * Serves the API's HTTP routes (`/graphql`, `/cms/*`, `/wb/*`) from a Lambda web function instead of
 * the `graphql` Lambda behind API Gateway. The `graphql` Lambda stays for everything that is not HTTP.
 *
 * The env var is read twice: by the function build, to also build `src/web.ts`, and by the API Pulumi
 * app, to create the web function and route CloudFront to it.
 */
export const ApiWebFunction = defineExtension({
    type: "Infra/Api/WebFunction",
    tags: { runtimeContext: "project" },
    description: "Serve the API's HTTP routes from a Lambda web function (experimental).",
    paramsSchema: z.object({
        enabled: z.boolean().describe("Whether to use a Lambda web function.").default(false)
    }),
    render(props) {
        if (!props.enabled) {
            return null;
        }
        return <EnvVar varName="WEBINY_API_WEB_FUNCTION" value="true" />;
    }
});
