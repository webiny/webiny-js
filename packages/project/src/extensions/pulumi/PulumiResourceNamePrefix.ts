import { z } from "zod";
import { defineExtension } from "~/defineExtension/index.js";

export const PulumiResourceNamePrefix = defineExtension({
    type: "Infra/PulumiResourceNamePrefix",
    tags: { runtimeContext: "project" },
    description: 'Adjust the prefix for Pulumi resource names (default: "wby-").',
    paramsSchema: z.object({
        prefix: z.string()
    })
});
