import { defineExtension } from "~/defineExtension/index.js";

export const AdminStackOutputValue = defineExtension({
    type: "Admin/StackOutputValue",
    tags: { runtimeContext: "project", appName: "admin" },
    description: "Add custom output values to the Admin stack.",
    multiple: true,
    paramsSchema: ({ z }) => ({
        key: z.string().describe("The key for the output value"),
        value: z.any().describe("The value to output")
    })
});
