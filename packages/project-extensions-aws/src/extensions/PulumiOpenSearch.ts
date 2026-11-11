import { defineExtension } from "@webiny/project/defineExtension/index.js";
import { openSearchParamsSchema } from "./OpenSearch.js";

export const PulumiOpenSearch = defineExtension({
    type: "Infra/OpenSearch",
    tags: { runtimeContext: "project", hosting: "aws" },
    description: "Enable and configure Opensearch integration.",
    paramsSchema: openSearchParamsSchema
});
