import { awsTags as AwsTags } from "./awsTags.js";
import { elasticSearch as ElasticSearch } from "./elasticSearch.js";
import { openSearch as OpenSearch } from "./openSearch.js";
import { vpc as Vpc } from "./vpc.js";
import { adminCustomDomains as AdminCustomDomains } from "./adminCustomDomains.js";
import { blueGreenDeployments as BlueGreenDeployments } from "~/pulumi/extensions/blueGreenDeployments.js";

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
