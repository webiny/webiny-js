import { defineExtension } from "~/defineExtension/index.js";
import { zodPathToAbstraction } from "~/defineExtension/zodTypes/zodPathToAbstraction.js";
import { BeforeWatch as BeforeWatchAbstraction } from "~/abstractions/index.js";
import { z } from "zod";

export const BeforeWatch = defineExtension({
    type: "Project/BeforeWatch",
    tags: { runtimeContext: "project" },
    description: "Add custom logic to be executed before the project watch process.",
    multiple: true,
    paramsSchema: ({ project, z }) => {
        return z.object({
            src: zodPathToAbstraction(BeforeWatchAbstraction, project)
        });
    }
});
