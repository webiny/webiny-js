import { defineExtension } from "~/defineExtension/index.js";
import { zodSrcPath } from "~/defineExtension/zodTypes/zodSrcPath.js";
import { AdminBeforeWatch as AdminBeforeWatchAbstraction } from "~/abstractions/index.js";
import { z } from "zod";

export const AdminBeforeWatch = defineExtension({
    type: "Admin/BeforeWatch",
    tags: { runtimeContext: "project", application: "admin" },
    description: "Add custom logic to be executed before the Admin watch process.",
    multiple: true,
    paramsSchema: ({ project }) => {
        return z.object({
            src: zodSrcPath({ project, abstraction: AdminBeforeWatchAbstraction })
        });
    }
});
