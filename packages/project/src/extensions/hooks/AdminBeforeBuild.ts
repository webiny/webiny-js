import { defineExtension } from "~/defineExtension/index.js";
import { zodSrcPath } from "~/defineExtension/zodTypes/zodSrcPath.js";
import { AdminBeforeBuild as AdminBeforeBuildAbstraction } from "~/abstractions/index.js";
import { z } from "zod";

export const AdminBeforeBuild = defineExtension({
    type: "Admin/BeforeBuild",
    tags: { runtimeContext: "project", application: "admin" },
    description: "Add custom logic to be executed before the ADMIN build process.",
    multiple: true,
    paramsSchema: ({ project }) => {
        return z.object({
            src: zodSrcPath({ project, abstraction: AdminBeforeBuildAbstraction })
        });
    }
});
