import { defineExtension } from "~/defineExtension/index.js";
import { zodPathToAbstraction } from "~/defineExtension/zodTypes/zodPathToAbstraction.js";
import { CoreAfterDeploy as CoreAfterDeployAbstraction } from "~/abstractions/index.js";

export const CoreAfterDeploy = defineExtension({
    type: "Core/AfterDeploy",
    tags: { runtimeContext: "project", application: "core" },
    description: "Add custom logic to be executed after the CORE deployment process.",
    multiple: true,
    paramsSchema: ({ project, z }) => {
        return z.object({
            src: zodPathToAbstraction(CoreAfterDeployAbstraction, project)
        });
    }
});
