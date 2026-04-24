import { defineExtension } from "@webiny/project/defineExtension/index.js";
import { z } from "zod";

export const OpenSearch = defineExtension({
    type: "Infra/OpenSearch",
    tags: { runtimeContext: "project" },
    description: "Enable and configure Opensearch integration.",
    paramsSchema: z.object({
        enabled: z.boolean().describe("Whether to enable OpenSearch.").default(false).optional(),
        domainName: z
            .string()
            .describe(
                "The name of the Opensearch domain. When set, no new domain will be deployed."
            )
            .optional(),
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
            .optional(),
        endpoint: z
            .string()
            .describe(
                "The endpoint of an existing OpenSearch cluster. Useful when cluster is behind a custom domain."
            )
            .optional(),
        username: z.string().describe("The username for OpenSearch authentication.").optional(),
        password: z.string().describe("The password for OpenSearch authentication.").optional()
    })
});
