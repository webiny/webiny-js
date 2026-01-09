import { defineExtension } from "~/defineExtension/index.js";

export const ExtensionDefinitions = defineExtension({
    type: "Project/ExtensionDefinitions",
    tags: { runtimeContext: "project" },
    description: "Register additional extension definitions.",
    multiple: true,
    paramsSchema: (z: typeof import('zod').z) => ({
        src: z.string()
    })
});
