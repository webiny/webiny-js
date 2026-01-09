import { defineExtension } from "~/defineExtension/index.js";
import { zodPathToAbstraction } from "~/defineExtension/zodTypes/zodPathToAbstraction.js";
import { AdminBeforeWatch as AdminBeforeWatchAbstraction } from "~/abstractions/index.js";

export const AdminBeforeWatch = defineExtension({
    type: "Admin/BeforeWatch",
    tags: { runtimeContext: "project", application: "admin" },
    description: "Add custom logic to be executed before the Admin watch process.",
    multiple: true,
    paramsSchema: ({ project, z }) => {
        return z.object({
            src: zodPathToAbstraction(AdminBeforeWatchAbstraction, project)
        });
    }
});
