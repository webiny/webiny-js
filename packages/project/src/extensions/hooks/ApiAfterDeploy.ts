import { defineExtension } from "~/defineExtension/index.js";
import { zodPathToAbstraction } from "~/defineExtension/zodTypes/zodPathToAbstraction.js";
import { ApiAfterDeploy as ApiAfterDeployAbstraction } from "~/abstractions/index.js";

export const ApiAfterDeploy = defineExtension({
    type: "Api/AfterDeploy",
    tags: { runtimeContext: "project", application: "api" },
    description: "Add custom logic to be executed after the API deployment process.",
    multiple: true,
    paramsSchema: ({ project, z }) => {
        return {
            src: zodPathToAbstraction(ApiAfterDeployAbstraction, project)
        };
    }
});
