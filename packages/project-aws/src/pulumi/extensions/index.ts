import { AwsTags } from "./AwsTags.js";
import { OpenSearch } from "./OpenSearch.js";
import { Vpc } from "./Vpc.js";
import { AdminCustomDomains } from "./AdminCustomDomains.js";
import { BlueGreenDeployments } from "~/pulumi/extensions/BlueGreenDeployments.js";
import { ApiLambdaFunction } from "~/extensions/ApiLambdaFunction.js";

export { AwsTags };
export { Vpc };
export { OpenSearch };
export { AdminCustomDomains };
export { BlueGreenDeployments };

export const definitions = [
    AwsTags.def,
    Vpc.def,
    OpenSearch.def,
    AdminCustomDomains.def,
    BlueGreenDeployments.def,
    ApiLambdaFunction.def
];
