import { AwsTags } from "./AwsTags.js";
import { CorePulumi } from "./CorePulumi.js";
import { ElasticSearch } from "./ElasticSearch.js";
import { OpenSearch } from "./OpenSearch.js";
import { Vpc } from "./Vpc.js";
import { AdminCustomDomains } from "./AdminCustomDomains.js";
import { BlueGreenDeployments } from "~/pulumi/extensions/BlueGreenDeployments.js";

export { AwsTags };
export { CorePulumi };
export { Vpc };
export { ElasticSearch };
export { OpenSearch };
export { AdminCustomDomains };
export { BlueGreenDeployments };

export const definitions = [
    AwsTags.definition,
    CorePulumi.definition,
    Vpc.definition,
    ElasticSearch.definition,
    OpenSearch.definition,
    AdminCustomDomains.definition,
    BlueGreenDeployments.definition
];
