import { AwsTags } from "./AwsTags.js";
import { ElasticSearch } from "./ElasticSearch.js";
import { OpenSearch } from "./OpenSearch.js";
import { Vpc } from "./Vpc.js";
import { AdminCustomDomains } from "./AdminCustomDomains.js";
import { BlueGreenDeployments } from "~/pulumi/extensions/BlueGreenDeployments.js";

export { AwsTags };
export { Vpc };
export { ElasticSearch };
export { OpenSearch };
export { AdminCustomDomains };
export { BlueGreenDeployments };

export const definitions = [
    AwsTags.definition,
    Vpc.definition,
    ElasticSearch.definition,
    OpenSearch.definition,
    AdminCustomDomains.definition,
    BlueGreenDeployments.definition
];
