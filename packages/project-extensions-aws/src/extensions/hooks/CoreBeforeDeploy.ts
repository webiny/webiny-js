import { defineExtension } from "@webiny/project/defineExtension/index.js";
import { zodSrcPath } from "@webiny/project/defineExtension/zodTypes/zodSrcPath.js";
import { CoreBeforeDeploy as CoreBeforeDeployAbstraction } from "~/abstractions/features/hooks/CoreBeforeDeploy.js";
import { z } from "zod";

export const CoreBeforeDeploy = defineExtension({
    type: "Core/BeforeDeploy",
    tags: { runtimeContext: "project", application: "core", hosting: "aws" },
    description: "Add custom logic to be executed before the CORE deployment process.",
    multiple: true,
    paramsSchema: ({ project }) => {
        return z.object({
            src: zodSrcPath({ project, abstraction: CoreBeforeDeployAbstraction })
        });
    }
});
