import { registerExtensionImplementation } from "@webiny/project/extensions/hosting/index.js";
import {
    ApiLambdaFunction as ApiLambdaFunctionSpec,
    ApiRoute as ApiRouteSpec,
    OpenSearch as OpenSearchSpec
} from "@webiny/project/extensions/aws/index.js";
import { ApiLambdaFunction } from "./ApiLambdaFunction.js";
import { ApiRoute } from "./ApiRoute.js";
import { OpenSearch } from "./OpenSearch.js";

/*
 * The shared namespaces in `@webiny/project` (exported through `webiny/extensions`) only hold
 * specs of these extensions, because what they render depends on code from this package. Running
 * this module makes the shared `Infra.OpenSearch`, `Api.Route` and `Infra.Api.LambdaFunction`
 * render the full components below. `ProjectAws.tsx` imports it, so it runs before any project
 * config renders.
 */
registerExtensionImplementation(OpenSearchSpec, OpenSearch);
registerExtensionImplementation(ApiRouteSpec, ApiRoute);
registerExtensionImplementation(ApiLambdaFunctionSpec, ApiLambdaFunction);
