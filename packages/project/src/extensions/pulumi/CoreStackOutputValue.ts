import { defineExtension } from "~/defineExtension/index.js";

export const CoreStackOutputValue = defineExtension({
    type: "Core/StackOutputValue",
    tags: { runtimeContext: "project", appName: "core" },
    description: "Add custom output values to the Core stack.",
    multiple: true,
    paramsSchema: (z: typeof import('zod').z) => ({
        key: z.string().describe("The key for the output value"),
        value: z.any().describe("The value to output")
    })
});
