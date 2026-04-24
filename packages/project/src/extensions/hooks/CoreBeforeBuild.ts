import { defineExtension } from "~/defineExtension/index.js";
import { zodSrcPath } from "~/defineExtension/zodTypes/zodSrcPath.js";
import { CoreBeforeBuild as CoreBeforeBuildAbstraction } from "~/abstractions/index.js";
import { z } from "zod";

export const CoreBeforeBuild = defineExtension({
    type: "Core/BeforeBuild",
    tags: { runtimeContext: "project", application: "core" },
    description: "Add custom logic to be executed before the CORE build process.",
    multiple: true,
    paramsSchema: ({ project }) => {
        return z.object({
            src: zodSrcPath({ project, abstraction: CoreBeforeBuildAbstraction })
        });
    }
});
