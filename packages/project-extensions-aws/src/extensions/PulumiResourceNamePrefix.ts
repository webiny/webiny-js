import { z } from "zod";
import { defineExtension } from "@webiny/project/defineExtension/index.js";

export const PulumiResourceNamePrefix = defineExtension({
    type: "Infra/PulumiResourceNamePrefix",
    tags: { runtimeContext: "project", hosting: "aws" },
    description: 'Adjust the prefix for Pulumi resource names (default: "wby-").',
    paramsSchema: z.object({
        prefix: z.string()
    })
});
