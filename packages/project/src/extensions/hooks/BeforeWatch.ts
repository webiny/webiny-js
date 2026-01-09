import { defineExtension } from "~/defineExtension/index.js";
import { zodPathToAbstraction } from "~/defineExtension/zodTypes/zodPathToAbstraction.js";
import { BeforeWatch as BeforeWatchAbstraction } from "~/abstractions/index.js";

export const BeforeWatch = defineExtension({
    type: "Project/BeforeWatch",
    tags: { runtimeContext: "project" },
    description: "Add custom logic to be executed before the project watch process.",
    multiple: true,
    paramsSchema: ({ project, z }) => {
        return {
            src: zodPathToAbstraction(BeforeWatchAbstraction, project)
        };
    }
});
