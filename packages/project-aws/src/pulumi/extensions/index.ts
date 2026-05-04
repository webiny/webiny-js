import { AwsTags } from "./AwsTags.js";
import { OpenSearch } from "./OpenSearch.js";
import { Vpc } from "./Vpc.js";
import { AdminCustomDomains } from "./AdminCustomDomains.js";
import { ApiCustomDomains } from "./ApiCustomDomains.js";
import { BlueGreenDeployments } from "~/pulumi/extensions/BlueGreenDeployments.js";
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
