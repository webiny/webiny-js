import { defineExtension } from "@webiny/project/defineExtension/index.js";
import { z } from "zod";

export const OpenSearch = defineExtension({
    type: "Infra/OpenSearch",
    tags: { runtimeContext: "project" },
    description: "Enable and configure Opensearch integration.",
    paramsSchema: z.object({
        enabled: z.boolean().describe("Whether to enable OpenSearch.").default(false).optional(),
        domainName: z.string().describe("The name of the Opensearch domain.").optional(),
        indexPrefix: z
            .string()
            .describe("A prefix to be added to all Opensearch indexes.")
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
