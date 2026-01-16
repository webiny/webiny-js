import { z } from "zod";
import { defineExtension } from "../defineExtension/index.js";
import { zodAbsoluteOrRootPath } from "../defineExtension/zodTypes/zodAbsoluteOrRootPath.js";

export const ProjectImplementation = defineExtension({
    type: "Project/Implementation",
    tags: { runtimeContext: "project" },
    multiple: true,
    description: "Define a custom implementation or replace an existing one.",
    paramsSchema: ({ project }) => {
        return z.object({
            src: zodAbsoluteOrRootPath(project),
            singleton: z.boolean().optional().default(true)
        });
    }
});
