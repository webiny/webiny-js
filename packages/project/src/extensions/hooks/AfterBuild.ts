import { defineExtension } from "~/defineExtension/index.js";
import { zodPathToAbstraction } from "~/defineExtension/zodTypes/zodPathToAbstraction.js";
import { AfterBuild as AfterBuildAbstraction } from "~/abstractions/index.js";

export const AfterBuild = defineExtension({
    type: "Project/AfterBuild",
    tags: { runtimeContext: "project" },
    description: "Add custom logic to be executed after the PROJECT build process.",
    multiple: true,
    paramsSchema: ({ project, z }) => {
        return z.object({
            src: zodPathToAbstraction(AfterBuildAbstraction, project)
        });
    }
});
