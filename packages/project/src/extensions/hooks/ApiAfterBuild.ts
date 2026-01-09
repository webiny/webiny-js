import { defineExtension } from "~/defineExtension/index.js";
import { zodPathToAbstraction } from "~/defineExtension/zodTypes/zodPathToAbstraction.js";
import { ApiAfterBuild as ApiAfterBuildAbstraction } from "~/abstractions/index.js";

export const ApiAfterBuild = defineExtension({
    type: "Api/AfterBuild",
    tags: { runtimeContext: "project", application: "api" },
    description: "Add custom logic to be executed after the API build process.",
    multiple: true,
    paramsSchema: ({ project, z }) => {
        return z.object({
            src: zodPathToAbstraction(ApiAfterBuildAbstraction, project)
        });
    }
});
