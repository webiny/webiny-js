import { z } from "zod";
import { defineExtension } from "../defineExtension/index.js";
import { zodPathToFile } from "../defineExtension/zodTypes/zodPathToFile.js";

export const projectImplementation = defineExtension({
    type: "Project/Implementation",
    tags: { runtimeContext: "project" },
    description: "Replace an existing implementation with a custom one.",
    paramsSchema: ({ project }) => {
        return z.object({
            src: zodPathToFile(project),
            singleton: z.boolean().optional().default(true)
        });
    }
});
