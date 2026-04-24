import { defineExtension } from "~/defineExtension/index.js";
import { zodSrcPath } from "~/defineExtension/zodTypes/zodSrcPath.js";
import { CoreAfterBuild as CoreAfterBuildAbstraction } from "~/abstractions/index.js";
import { z } from "zod";

export const CoreAfterBuild = defineExtension({
    type: "Core/AfterBuild",
    tags: { runtimeContext: "project", application: "core" },
    description: "Add custom logic to be executed after the CORE build process.",
    multiple: true,
    paramsSchema: ({ project }) => {
        return z.object({
            src: zodSrcPath({ project, abstraction: CoreAfterBuildAbstraction })
        });
    }
});
