import { defineExtension } from "~/defineExtension/index.js";
import { zodSrcPath } from "~/defineExtension/zodTypes/zodSrcPath.js";
import { CoreBeforeWatch as CoreBeforeWatchAbstraction } from "~/abstractions/index.js";
import { z } from "zod";

export const CoreBeforeWatch = defineExtension({
    type: "Core/BeforeWatch",
    tags: { runtimeContext: "project", application: "core" },
    description: "Add custom logic to be executed before the CORE watch process.",
    multiple: true,
    paramsSchema: ({ project }) => {
        return z.object({
            src: zodSrcPath({ project, abstraction: CoreBeforeWatchAbstraction })
        });
    }
});
