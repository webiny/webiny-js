import { defineExtension } from "~/defineExtension/index.js";
import { zodSrcPath } from "~/defineExtension/zodTypes/zodSrcPath.js";
import { ApiBeforeBuild as ApiBeforeBuildAbstraction } from "~/abstractions/index.js";
import { z } from "zod";

export const ApiBeforeBuild = defineExtension({
    type: "Api/BeforeBuild",
    tags: { runtimeContext: "project", application: "api" },
    description: "Add custom logic to be executed before the API build process.",
    multiple: true,
    paramsSchema: ({ project }) => {
        return z.object({
            src: zodSrcPath({ project, abstraction: ApiBeforeBuildAbstraction })
        });
    }
});
