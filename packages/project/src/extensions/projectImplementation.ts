import { z } from "zod";
import { defineExtension } from "../defineExtension/index.js";
import { zodPathToFile } from "../defineExtension/zodTypes/zodPathToFile.js";

export const projectImplementation = defineExtension({
    type: "Project/Implementation",
    tags: { runtimeContext: "project" },
    description: "Register a custom implementation for an abstraction.",
    paramsSchema: ({ project }) => {
        return z.object({
            src: zodPathToFile(project)
        });
    }
});

