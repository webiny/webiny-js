import { defineExtension } from "~/defineExtension/index.js";
import { zodSrcPath } from "~/defineExtension/zodTypes/zodSrcPath.js";
import { ApiAfterDeploy as ApiAfterDeployAbstraction } from "~/abstractions/index.js";
import { z } from "zod";

export const ApiAfterDeploy = defineExtension({
    type: "Api/AfterDeploy",
    tags: { runtimeContext: "project", application: "api" },
    description: "Add custom logic to be executed after the API deployment process.",
    multiple: true,
    paramsSchema: ({ project }) => {
        return z.object({
            src: zodSrcPath({ project, abstraction: ApiAfterDeployAbstraction })
        });
    }
});
