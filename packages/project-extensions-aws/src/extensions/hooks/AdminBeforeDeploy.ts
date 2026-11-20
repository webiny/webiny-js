import { defineExtension } from "@webiny/project/defineExtension/index.js";
import { zodSrcPath } from "@webiny/project/defineExtension/zodTypes/zodSrcPath.js";
import { AdminBeforeDeploy as AdminBeforeDeployAbstraction } from "~/abstractions/features/hooks/AdminBeforeDeploy.js";
import { z } from "zod";

export const AdminBeforeDeploy = defineExtension({
    type: "Admin/BeforeDeploy",
    tags: { runtimeContext: "project", application: "admin", hosting: "aws" },
    description: "Add custom logic to be executed before the ADMIN deployment process.",
    multiple: true,
    paramsSchema: ({ project }) => {
        return z.object({
            src: zodSrcPath({ project, abstraction: AdminBeforeDeployAbstraction })
        });
    }
});
