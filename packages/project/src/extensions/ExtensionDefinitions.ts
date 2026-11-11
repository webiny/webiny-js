import { defineExtension } from "~/defineExtension/index.js";
import { z } from "zod";

export const ExtensionDefinitions = defineExtension({
    type: "Project/ExtensionDefinitions",
    tags: { runtimeContext: "project", hosting: "all" },
    description: "Register additional extension definitions.",
    multiple: true,
    paramsSchema: z.object({
        src: z.string()
    })
});
