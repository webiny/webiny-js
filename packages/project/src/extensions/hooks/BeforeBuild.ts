import { defineExtension } from "~/defineExtension/index.js";
import { zodPathToAbstraction } from "~/defineExtension/zodTypes/zodPathToAbstraction.js";
import { BeforeBuild as BeforeBuildAbstraction } from "~/abstractions/index.js";
import { z } from "zod";

export const BeforeBuild = defineExtension({
    type: "Project/BeforeBuild",
    tags: { runtimeContext: "project" },
    description: "Add custom logic to be executed before the PROJECT build process.",
    multiple: true,
    paramsSchema: ({ project }) => {
        return z.object({
            src: zodPathToAbstraction(BeforeBuildAbstraction, project)
        });
    }
});
