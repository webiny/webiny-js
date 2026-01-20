import { defineExtension } from "~/defineExtension/index.js";
import { zodSrcPath } from "~/defineExtension/zodTypes/zodSrcPath.js";
import { CoreAfterDeploy as CoreAfterDeployAbstraction } from "~/abstractions/index.js";
import { z } from "zod";

export const CoreAfterDeploy = defineExtension({
    type: "Core/AfterDeploy",
    tags: { runtimeContext: "project", application: "core" },
    description: "Add custom logic to be executed after the CORE deployment process.",
    multiple: true,
    paramsSchema: ({ project }) => {
        return z.object({
            src: zodSrcPath({ project, abstraction: CoreAfterDeployAbstraction })
        });
    }
});
