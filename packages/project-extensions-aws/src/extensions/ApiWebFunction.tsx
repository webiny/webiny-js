import React from "react";
import { z } from "zod";
import { defineExtension } from "@webiny/project/defineExtension/index.js";
import { EnvVar } from "@webiny/project/extensions/EnvVar.js";

/**
 * The API's HTTP routes are served by a Lambda web function by default, with no HTTP API Gateway.
 * `<Infra.Api.WebFunction enabled={false} />` keeps the previous setup: API Gateway in front of the
 * `graphql` Lambda. The `graphql` Lambda exists either way, for everything that is not HTTP.
 *
 * The API Pulumi app reads this extension through `isWebFunctionEnabled`. The env var is for the
 * graphql workspace's build, which can't read project extensions, to know whether to also build
 * `src/web.ts`. Only the value "false" turns that off, so a project without this extension gets it.
 */
export const ApiWebFunction = defineExtension({
    type: "Infra/Api/WebFunction",
    tags: { runtimeContext: "project", hosting: "aws" },
    description: "Serve the API's HTTP routes from a Lambda web function (on by default).",
    paramsSchema: z.object({
        enabled: z.boolean().describe("Whether to use a Lambda web function.").default(true)
    }),
    render(props) {
        const value = String(props.enabled);
        return <EnvVar varName="WEBINY_API_WEB_FUNCTION" value={value} />;
    }
});
