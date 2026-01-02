import { z } from "zod";
import { defineExtension } from "@webiny/project/defineExtension/index.js";

export const AwsTags = defineExtension({
    type: "Infra/AwsTags",
    tags: { runtimeContext: "project" },
    description: "Apply tags to AWS resources during deployment.",
    multiple: true,
    paramsSchema: z.object({
        tags: z.record(z.string())
    })
});
