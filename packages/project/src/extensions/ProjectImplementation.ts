import { z } from "zod";
import { defineExtension } from "../defineExtension/index.js";
import { zodPathToFile } from "../defineExtension/zodTypes/zodPathToFile.js";

export const ProjectImplementation = defineExtension({
    type: "Project/Implementation",
    tags: { runtimeContext: "project" },
    description: "Define a custom implementation or replace an existing one.",
    paramsSchema: ({ project }) => {
        return z.object({
            src: zodPathToFile(project),
            singleton: z.boolean().optional().default(true)
        });
    }
});
