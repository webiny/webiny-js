import { AdminPulumi } from "./AdminPulumi.js";
import { ApiPulumi } from "./ApiPulumi.js";
import { AwsTags } from "./AwsTags.js";
import { CorePulumi } from "./CorePulumi.js";
import { ElasticSearch } from "./ElasticSearch.js";
import { OpenSearch } from "./OpenSearch.js";
import { Vpc } from "./Vpc.js";
import { AdminCustomDomains } from "./AdminCustomDomains.js";
import { BlueGreenDeployments } from "~/pulumi/extensions/BlueGreenDeployments.js";

export { AdminPulumi };
export { ApiPulumi };
export { AwsTags };
export { CorePulumi };
export { Vpc };
export { ElasticSearch };
export { OpenSearch };
export { AdminCustomDomains };
export { BlueGreenDeployments };

export const definitions = [
    AdminPulumi.def,
    ApiPulumi.def,
    AwsTags.def,
    CorePulumi.def,
    Vpc.def,
    ElasticSearch.def,
    OpenSearch.def,
    AdminCustomDomains.def,
    BlueGreenDeployments.def
];
