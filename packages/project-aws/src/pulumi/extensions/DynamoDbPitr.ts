import { defineExtension } from "@webiny/project/defineExtension/index.js";
import { z } from "zod";

export const DynamoDbPitr = defineExtension({
    type: "Infra/DynamoDb/Pitr",
    tags: { runtimeContext: "project" },
    description:
        "Enable or disable DynamoDB point-in-time recovery. Enabled by default for production environments.",
    paramsSchema: z.object({
        enabled: z.boolean().describe("Whether to enable point-in-time recovery.")
    })
});
