import { defineExtension } from "@webiny/project/defineExtension/index.js";
import { z } from "zod";

export const ElasticSearch = defineExtension({
    type: "Infra/ElasticSearch",
    tags: { runtimeContext: "project" },
    description: "Enable and configure Elasticsearch integration.",
    paramsSchema: z.object({
        enabled: z.boolean().describe("Whether to enable ElasticSearch.").default(false).optional(),
        domainName: z.string().describe("The name of the Elasticsearch domain.").optional(),
        indexPrefix: z
            .string()
            .describe("A prefix to be added to all Elasticsearch indexes.")
            .optional(),
        sharedIndexes: z
            .boolean()
            .describe(
                "Whether to use shared indexes across all environments (true) or separate indexes per environment (false)."
            )
            .default(false)
            .optional()
    })
});
