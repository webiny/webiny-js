import { registerExtensionImplementation } from "@webiny/project/extensions/hosting/index.js";
import { ApiLambdaFunction as ApiLambdaFunctionSpec } from "@webiny/project-extensions-aws/extensions/index.js";
import { ApiRoute as ApiRouteSpec } from "@webiny/project/extensions/api/index.js";
import { OpenSearch as OpenSearchSpec } from "@webiny/project-extensions-aws/extensions/index.js";
import { Postgres as PostgresSpec } from "@webiny/project-extensions-aws/extensions/index.js";
import { RdsProxy as RdsProxySpec } from "@webiny/project-extensions-aws/extensions/index.js";
import { ApiLambdaFunction } from "./ApiLambdaFunction.js";
import { ApiRoute } from "./ApiRoute.js";
import { OpenSearch } from "./OpenSearch.js";
import { Postgres } from "./Postgres.js";
import { RdsProxy } from "./RdsProxy.js";

/*
 * The shared namespaces in `@webiny/extensions` (exported through `webiny/extensions`) only hold
 * specs of these extensions, because what they render depends on code from this package. Running
 * this module makes the shared `Infra.OpenSearch`, `Infra.Postgres`, `Infra.RdsProxy`, `Api.Route`
 * and `Infra.Api.LambdaFunction` render the full components below. `ProjectAws.tsx` imports it,
 * so it runs before any project config renders.
 */
registerExtensionImplementation("aws", OpenSearchSpec, OpenSearch);
registerExtensionImplementation("aws", PostgresSpec, Postgres);
registerExtensionImplementation("aws", RdsProxySpec, RdsProxy);
registerExtensionImplementation("aws", ApiRouteSpec, ApiRoute);
registerExtensionImplementation("aws", ApiLambdaFunctionSpec, ApiLambdaFunction);
