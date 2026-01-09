import { defineExtension } from "~/defineExtension/index.js";
import { zodPathToAbstraction } from "~/defineExtension/zodTypes/zodPathToAbstraction.js";
import { ApiBeforeWatch as ApiBeforeWatchAbstraction } from "~/abstractions/index.js";

export const ApiBeforeWatch = defineExtension({
    type: "Api/BeforeWatch",
    tags: { runtimeContext: "project", application: "api" },
    description: "Add custom logic to be executed before the API watch process.",
    multiple: true,
    paramsSchema: ({ project, z }) => {
        return z.object({
            src: zodPathToAbstraction(ApiBeforeWatchAbstraction, project)
        });
    }
});
