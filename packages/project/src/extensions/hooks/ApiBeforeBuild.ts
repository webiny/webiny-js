import { defineExtension } from "~/defineExtension/index.js";
import { zodPathToAbstraction } from "~/defineExtension/zodTypes/zodPathToAbstraction.js";
import { ApiBeforeBuild as ApiBeforeBuildAbstraction } from "~/abstractions/index.js";
import { z } from "zod";

export const ApiBeforeBuild = defineExtension({
    type: "Api/BeforeBuild",
    tags: { runtimeContext: "project", application: "api" },
    description: "Add custom logic to be executed before the API build process.",
    multiple: true,
    paramsSchema: ({ project }) => {
        return z.object({
            src: zodPathToAbstraction(ApiBeforeBuildAbstraction, project)
        });
    }
});
