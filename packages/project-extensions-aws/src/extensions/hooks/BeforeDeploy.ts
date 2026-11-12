import { defineExtension } from "@webiny/project/defineExtension/index.js";
import { zodSrcPath } from "@webiny/project/defineExtension/zodTypes/zodSrcPath.js";
import { BeforeDeploy as BeforeDeployAbstraction } from "~/abstractions/features/hooks/BeforeDeploy.js";
import { z } from "zod";

export const BeforeDeploy = defineExtension({
    type: "Project/BeforeDeploy",
    tags: { runtimeContext: "project", hosting: "aws" },
    description: "Add custom logic to be executed before the PROJECT deploy process.",
    multiple: true,
    paramsSchema: ({ project }) => {
        return z.object({
            src: zodSrcPath({ project, abstraction: BeforeDeployAbstraction })
        });
    }
});
