import { defineExtension } from "@webiny/project/defineExtension/index.js";
import { zodSrcPath } from "@webiny/project/defineExtension/zodTypes/zodSrcPath.js";
import { AfterDeploy as AfterDeployAbstraction } from "~/abstractions/features/hooks/AfterDeploy.js";
import { z } from "zod";

export const AfterDeploy = defineExtension({
    type: "Project/AfterDeploy",
    tags: { runtimeContext: "project", hosting: "aws" },
    description: "Add custom logic to be executed after the PROJECT deploy process.",
    multiple: true,
    paramsSchema: ({ project }) => {
        return z.object({
            src: zodSrcPath({ project, abstraction: AfterDeployAbstraction })
        });
    }
});
