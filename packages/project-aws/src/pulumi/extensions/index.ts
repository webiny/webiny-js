import { AwsTags } from "./awsTags.js";
import { ElasticSearch } from "./elasticSearch.js";
import { OpenSearch } from "./openSearch.js";
import { Vpc } from "./vpc.js";
import { AdminCustomDomains } from "./adminCustomDomains.js";
import { BlueGreenDeployments } from "~/pulumi/extensions/blueGreenDeployments.js";

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
