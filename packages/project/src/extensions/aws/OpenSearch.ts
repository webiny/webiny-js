import { z } from "zod";
import { defineExtension } from "~/defineExtension/index.js";

export const openSearchParamsSchema = z.object({
    enabled: z.boolean().describe("Whether to enable OpenSearch.").default(false).optional(),
    domainName: z.string().describe("The name of the Opensearch domain.").optional(),
    indexPrefix: z.string().describe("A prefix to be added to all Opensearch indexes.").optional(),
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
});

/**
 * Spec of the `Project/OpenSearch` extension, used by the shared `Infra` namespace. The
 * implementation, which renders the Pulumi config and the deploy hooks, is registered by
 * `@webiny/project-aws`.
 */
export const OpenSearch = defineExtension({
    type: "Project/OpenSearch",
    tags: { runtimeContext: "project", hosting: "aws" },
    description: "Enable and configure Opensearch integration with project-level setup.",
    paramsSchema: openSearchParamsSchema,
    render: () => {
        throw new Error(`"Infra.OpenSearch" requires the "@webiny/project-aws" package.`);
    }
});
