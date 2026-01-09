import { defineExtension } from "~/defineExtension/index.js";
import { zodPathToAbstraction } from "~/defineExtension/zodTypes/zodPathToAbstraction.js";
import { CoreBeforeDeploy as CoreBeforeDeployAbstraction } from "~/abstractions/index.js";
import { z } from "zod";

export const CoreBeforeDeploy = defineExtension({
    type: "Core/BeforeDeploy",
    tags: { runtimeContext: "project", application: "core" },
    description: "Add custom logic to be executed before the CORE deployment process.",
    multiple: true,
    paramsSchema: ({ project, z }) => {
        return z.object({
            src: zodPathToAbstraction(CoreBeforeDeployAbstraction, project)
        });
    }
});
