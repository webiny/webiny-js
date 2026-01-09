import { defineExtension } from "~/defineExtension/index.js";
import { zodPathToAbstraction } from "~/defineExtension/zodTypes/zodPathToAbstraction.js";
import { CoreAfterBuild as CoreAfterBuildAbstraction } from "~/abstractions/index.js";

export const CoreAfterBuild = defineExtension({
    type: "Core/AfterBuild",
    tags: { runtimeContext: "project", application: "core" },
    description: "Add custom logic to be executed after the CORE build process.",
    multiple: true,
    paramsSchema: ({ project, z }) => {
        return z.object({
            src: zodPathToAbstraction(CoreAfterBuildAbstraction, project)
        });
    }
});
