import { defineExtension } from "~/defineExtension/index.js";
import { zodSrcPath } from "~/defineExtension/zodTypes/zodSrcPath.js";
import { BeforeWatch as BeforeWatchAbstraction } from "~/abstractions/index.js";
import { z } from "zod";

export const BeforeWatch = defineExtension({
    type: "Project/BeforeWatch",
    tags: { runtimeContext: "project" },
    description: "Add custom logic to be executed before the project watch process.",
    multiple: true,
    paramsSchema: ({ project }) => {
        return z.object({
            src: zodSrcPath({ project, abstraction: BeforeWatchAbstraction })
        });
    }
});
