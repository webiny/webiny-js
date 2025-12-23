import { z } from "zod";
import { defineExtension } from "~/defineExtension/index.js";

export const envVar = defineExtension({
    type: "Project/EnvVar",
    tags: { runtimeContext: "project" },
    description: "Set an environment variable in the project context.",
    multiple: true,
    paramsSchema: z.object({
        name: z.string().describe("The environment variable name."),
        value: z.string().describe("The environment variable value.")
    })
});
