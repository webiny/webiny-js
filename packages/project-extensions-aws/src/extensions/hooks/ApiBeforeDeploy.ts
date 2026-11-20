import { defineExtension } from "@webiny/project/defineExtension/index.js";
import { zodSrcPath } from "@webiny/project/defineExtension/zodTypes/zodSrcPath.js";
import { ApiBeforeDeploy as ApiBeforeDeployAbstraction } from "~/abstractions/features/hooks/ApiBeforeDeploy.js";
import { z } from "zod";

export const ApiBeforeDeploy = defineExtension({
    type: "Api/BeforeDeploy",
    tags: { runtimeContext: "project", application: "api", hosting: "aws" },
    description: "Add custom logic to be executed before the API deployment process.",
    multiple: true,
    paramsSchema: ({ project }) => {
        return z.object({
            src: zodSrcPath({ project, abstraction: ApiBeforeDeployAbstraction })
        });
    }
});
