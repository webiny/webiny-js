import { defineExtension } from "~/defineExtension/index.js";

export const EnvVar = defineExtension({
    type: "Project/EnvVar",
    tags: { runtimeContext: "project" },
    description: "Set an environment variable in the project context.",
    multiple: true,
    paramsSchema: (z: typeof import('zod').z) => ({
        // TODO: enable using `name` instead of `varName` for better consistency.
        varName: z.string().describe("The environment variable name."),
        value: z.string().describe("The environment variable value.")
    })
});
