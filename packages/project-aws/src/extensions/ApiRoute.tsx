import React from "react";
import { defineExtension } from "@webiny/project/defineExtension/index.js";
import { ApiRoute as SharedApiRoute } from "@webiny/project/extensions/api/index.js";
import { ApiPulumi } from "~/pulumi/extensions/ApiPulumi.js";
import { createPathResolver } from "@webiny/project";

const p = createPathResolver(import.meta.dirname);

/**
 * What `Api.Route` renders in an AWS project, registered in `registerExtensionImplementations.ts`.
 * It only adds the API Gateway route (`RegisterRoutesPulumi`). Validating the props and writing the
 * route into `extensions.ts` stay with the shared definition in `@webiny/project`, which is the one
 * the project config resolves `Api/Route` to, so there is no schema or build step here.
 */
export const ApiRoute = defineExtension({
    type: SharedApiRoute.def.type,
    tags: { runtimeContext: "app-build", hosting: "aws" },
    multiple: true,
    render() {
        return <ApiPulumi src={p("RegisterRoutesPulumi.js")} />;
    }
});
