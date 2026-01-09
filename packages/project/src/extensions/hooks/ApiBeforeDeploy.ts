import { defineExtension } from "~/defineExtension/index.js";
import { zodPathToAbstraction } from "~/defineExtension/zodTypes/zodPathToAbstraction.js";
import { ApiBeforeDeploy as ApiBeforeDeployAbstraction } from "~/abstractions/index.js";

export const ApiBeforeDeploy = defineExtension({
    type: "Api/BeforeDeploy",
    tags: { runtimeContext: "project", application: "api" },
    description: "Add custom logic to be executed before the API deployment process.",
    multiple: true,
    paramsSchema: ({ project, z }) => {
        return {
            src: zodPathToAbstraction(ApiBeforeDeployAbstraction, project)
        };
    }
});
