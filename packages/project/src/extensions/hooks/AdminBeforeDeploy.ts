import { defineExtension } from "~/defineExtension/index.js";
import { zodSrcPath } from "~/defineExtension/zodTypes/zodSrcPath.js";
import { AdminBeforeDeploy as AdminBeforeDeployAbstraction } from "~/abstractions/index.js";
import { z } from "zod";

export const AdminBeforeDeploy = defineExtension({
    type: "Admin/BeforeDeploy",
    tags: { runtimeContext: "project", application: "admin" },
    description: "Add custom logic to be executed before the ADMIN deployment process.",
    multiple: true,
    paramsSchema: ({ project }) => {
        return z.object({
            src: zodSrcPath({ project, abstraction: AdminBeforeDeployAbstraction })
        });
    }
});
