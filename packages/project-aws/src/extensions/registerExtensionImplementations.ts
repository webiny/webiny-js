import { registerExtensionImplementation } from "@webiny/project/extensions/hosting/index.js";
import { ApiLambdaFunction as ApiLambdaFunctionSpec } from "@webiny/project-aws-extensions/extensions/index.js";
import { ApiRoute as ApiRouteSpec } from "@webiny/project-aws-extensions/extensions/index.js";
import { OpenSearch as OpenSearchSpec } from "@webiny/project-aws-extensions/extensions/index.js";
import { ApiLambdaFunction } from "./ApiLambdaFunction.js";
import { ApiRoute } from "./ApiRoute.js";
import { OpenSearch } from "./OpenSearch.js";

/*
 * The shared namespaces in `@webiny/extensions` (exported through `webiny/extensions`) only hold
 * specs of these extensions, because what they render depends on code from this package. Running
 * this module makes the shared `Infra.OpenSearch`, `Api.Route` and `Infra.Api.LambdaFunction`
 * render the full components below. `ProjectAws.tsx` imports it, so it runs before any project
 * config renders.
 */
registerExtensionImplementation("aws", OpenSearchSpec, OpenSearch);
registerExtensionImplementation("aws", ApiRouteSpec, ApiRoute);
registerExtensionImplementation("aws", ApiLambdaFunctionSpec, ApiLambdaFunction);
