import { defineExtension } from "~/defineExtension/index.js";
import { zodSrcPath } from "~/defineExtension/zodTypes/zodSrcPath.js";
import { CoreBeforeDeploy as CoreBeforeDeployAbstraction } from "~/abstractions/index.js";
import { z } from "zod";

export const CoreBeforeDeploy = defineExtension({
    type: "Core/BeforeDeploy",
    tags: { runtimeContext: "project", application: "core" },
    description: "Add custom logic to be executed before the CORE deployment process.",
    multiple: true,
    paramsSchema: ({ project }) => {
        return z.object({
            src: zodSrcPath({ project, abstraction: CoreBeforeDeployAbstraction })
        });
    }
});
