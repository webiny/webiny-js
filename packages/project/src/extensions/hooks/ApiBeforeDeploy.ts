import { defineExtension } from "~/defineExtension/index.js";
import { zodSrcPath } from "~/defineExtension/zodTypes/zodSrcPath.js";
import { ApiBeforeDeploy as ApiBeforeDeployAbstraction } from "~/abstractions/index.js";
import { z } from "zod";

export const ApiBeforeDeploy = defineExtension({
    type: "Api/BeforeDeploy",
    tags: { runtimeContext: "project", application: "api" },
    description: "Add custom logic to be executed before the API deployment process.",
    multiple: true,
    paramsSchema: ({ project }) => {
        return z.object({
            src: zodSrcPath({ project, abstraction: ApiBeforeDeployAbstraction })
        });
    }
});
