import { z } from "zod";
import { defineExtension } from "@webiny/project/defineExtension/index.js";

export const rdsProxyParamsSchema = z.object({
    enabled: z
        .boolean()
        .describe("Whether to put an RDS Proxy in front of the Postgres database.")
        .default(false)
        .optional()
});

/**
 * Spec of the `Infra/RdsProxy` extension, used by the shared `Infra` namespace. Only works with
 * `<Infra.Postgres />`. The implementation, which renders the deploy check and the CMS defaults
 * that suit the proxy, is registered by `@webiny/project-aws`.
 */
export const RdsProxy = defineExtension({
    type: "Infra/RdsProxy",
    tags: { runtimeContext: "project", hosting: "aws" },
    description: "Put an RDS Proxy in front of the Postgres database (off when absent).",
    paramsSchema: rdsProxyParamsSchema,
    render: () => {
        throw new Error(`"Infra.RdsProxy" requires the "@webiny/project-aws" package.`);
    }
});
