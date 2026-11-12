import { defineExtension } from "@webiny/project/defineExtension/index.js";
import { zodSrcPath } from "@webiny/project/defineExtension/zodTypes/zodSrcPath.js";
import { CoreAfterDeploy as CoreAfterDeployAbstraction } from "~/abstractions/features/hooks/CoreAfterDeploy.js";
import { z } from "zod";

export const CoreAfterDeploy = defineExtension({
    type: "Core/AfterDeploy",
    tags: { runtimeContext: "project", application: "core", hosting: "aws" },
    description: "Add custom logic to be executed after the CORE deployment process.",
    multiple: true,
    paramsSchema: ({ project }) => {
        return z.object({
            src: zodSrcPath({ project, abstraction: CoreAfterDeployAbstraction })
        });
    }
});
