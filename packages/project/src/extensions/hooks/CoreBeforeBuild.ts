import { defineExtension } from "~/defineExtension/index.js";
import { zodPathToAbstraction } from "~/defineExtension/zodTypes/zodPathToAbstraction.js";
import { CoreBeforeBuild as CoreBeforeBuildAbstraction } from "~/abstractions/index.js";

export const CoreBeforeBuild = defineExtension({
    type: "Core/BeforeBuild",
    tags: { runtimeContext: "project", application: "core" },
    description: "Add custom logic to be executed before the CORE build process.",
    multiple: true,
    paramsSchema: ({ project, z }) => {
        return {
            src: zodPathToAbstraction(CoreBeforeBuildAbstraction, project)
        };
    }
});
