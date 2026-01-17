import { defineExtension } from "~/defineExtension/index.js";
import { zodSrcPath } from "~/defineExtension/zodTypes/zodSrcPath.js";
import { AfterBuild as AfterBuildAbstraction } from "~/abstractions/index.js";
import { z } from "zod";

export const AfterBuild = defineExtension({
    type: "Project/AfterBuild",
    tags: { runtimeContext: "project" },
    description: "Add custom logic to be executed after the PROJECT build process.",
    multiple: true,
    paramsSchema: ({ project }) => {
        return z.object({
            src: zodSrcPath({ project, abstraction: AfterBuildAbstraction })
        });
    }
});
