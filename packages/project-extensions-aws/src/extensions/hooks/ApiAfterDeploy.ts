import { defineExtension } from "@webiny/project/defineExtension/index.js";
import { zodSrcPath } from "@webiny/project/defineExtension/zodTypes/zodSrcPath.js";
import { ApiAfterDeploy as ApiAfterDeployAbstraction } from "~/abstractions/features/hooks/ApiAfterDeploy.js";
import { z } from "zod";

export const ApiAfterDeploy = defineExtension({
    type: "Api/AfterDeploy",
    tags: { runtimeContext: "project", application: "api", hosting: "aws" },
    description: "Add custom logic to be executed after the API deployment process.",
    multiple: true,
    paramsSchema: ({ project }) => {
        return z.object({
            src: zodSrcPath({ project, abstraction: ApiAfterDeployAbstraction })
        });
    }
});
