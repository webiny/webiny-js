import React from "react";
import { defineExtension } from "@webiny/project/defineExtension/index.js";
import { ApiRoute as SharedApiRoute } from "@webiny/project/extensions/api/index.js";
import { ApiPulumi } from "~/pulumi/extensions/ApiPulumi.js";
import { createPathResolver } from "@webiny/project";

const p = createPathResolver(import.meta.dirname);

/**
 * The AWS implementation of `Api.Route`. The shared definition in `@webiny/project` registers the
 * route with the API's DI router; on AWS, the request has to reach the GraphQL Lambda first, so
 * this also adds the route to API Gateway (`RegisterRoutesPulumi`).
 */
export const ApiRoute = defineExtension({
    type: SharedApiRoute.def.type,
    tags: { runtimeContext: "app-build", appName: "api", hosting: "aws" },
    description: "Register a custom HTTP route on the API Gateway + GraphQL Lambda.",
    multiple: true,
    paramsSchema: SharedApiRoute.def.paramsSchema,
    build: SharedApiRoute.def.build,
    render() {
        return <ApiPulumi src={p("RegisterRoutesPulumi.js")} />;
    }
});
