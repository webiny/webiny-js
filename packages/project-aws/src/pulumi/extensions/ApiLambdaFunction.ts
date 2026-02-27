import { defineExtension } from "@webiny/project/defineExtension/index.js";
import { z } from "zod";

export const ApiLambdaFunction = defineExtension({
    type: "Infra/ApiLambdaFunction",
    tags: { runtimeContext: "project" },
    description: "Configure API Lambda function settings (e.g. memory size, timeout).",
    paramsSchema: z.object({
        graphql: z
            .object({
                timeout: z
                    .number()
                    .int()
                    .min(1)
                    .max(900)
                    .optional()
                    .describe("The Lambda function timeout in seconds (1–900)."),
                memorySize: z
                    .number()
                    .int()
                    .min(128)
                    .max(10240)
                    .optional()
                    .describe("The Lambda function memory size in MB (128–10240).")
            })
            .optional()
            .describe("Settings for the GraphQL API Lambda function.")
    })
});
