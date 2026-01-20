import { z } from "zod";
import { defineExtension } from "../defineExtension/index.js";
import { zodSrcPath } from "../defineExtension/zodTypes/zodSrcPath.js";

export const ProjectImplementation = defineExtension({
    type: "Project/Implementation",
    tags: { runtimeContext: "project" },
    multiple: true,
    description: "Define a custom implementation or replace an existing one.",
    paramsSchema: ({ project }) => {
        return z.object({
            src: zodSrcPath({ project }),
            singleton: z.boolean().optional().default(true)
        });
    }
});
