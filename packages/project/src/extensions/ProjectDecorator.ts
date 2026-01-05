import { z } from "zod";
import { defineExtension } from "../defineExtension/index.js";
import { zodPathToFile } from "../defineExtension/zodTypes/zodPathToFile.js";

export const ProjectDecorator = defineExtension({
    type: "Project/Decorator",
    tags: { runtimeContext: "project" },
    multiple: true,
    description: "Decorate an existing implementation with additional functionality.",
    paramsSchema: ({ project }) => {
        return z.object({
            src: zodPathToFile(project)
        });
    }
});
