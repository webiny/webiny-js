import {
    AwsTags,
    PulumiOpenSearch as OpenSearch,
    Vpc,
    AdminCustomDomains,
    ApiCustomDomains,
    BlueGreenDeployments
} from "@webiny/project/extensions/aws/index.js";
import { CorePulumi } from "./CorePulumi.js";
import { ApiPulumi } from "./ApiPulumi.js";
import { AdminPulumi } from "./AdminPulumi.js";

export { AwsTags };
export { Vpc };
export { OpenSearch };
export { AdminCustomDomains };
export { ApiCustomDomains };
export { BlueGreenDeployments };
export { CorePulumi };
export { ApiPulumi };
export { AdminPulumi };

export const definitions = [
    AwsTags.def,
    Vpc.def,
    OpenSearch.def,
    AdminCustomDomains.def,
    ApiCustomDomains.def,
    BlueGreenDeployments.def,
    CorePulumi.def,
    ApiPulumi.def,
    AdminPulumi.def
];
