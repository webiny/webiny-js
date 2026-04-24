import { z } from "zod";
import { defineExtension } from "~/defineExtension/index.js";

export const ApiStackOutputValue = defineExtension({
    type: "Api/StackOutputValue",
    tags: { runtimeContext: "project", appName: "api" },
    description: "Add custom output values to the Api stack.",
    multiple: true,
    paramsSchema: z.object({
        key: z.string().describe("The key for the output value"),
        value: z.any().describe("The value to output")
    })
});
