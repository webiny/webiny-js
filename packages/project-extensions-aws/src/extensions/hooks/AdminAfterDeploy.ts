import { defineExtension } from "@webiny/project/defineExtension/index.js";
import { zodSrcPath } from "@webiny/project/defineExtension/zodTypes/zodSrcPath.js";
import { AdminAfterDeploy as AdminAfterDeployAbstraction } from "~/abstractions/features/hooks/AdminAfterDeploy.js";
import { z } from "zod";

export const AdminAfterDeploy = defineExtension({
    type: "Admin/AfterDeploy",
    tags: { runtimeContext: "project", application: "admin", hosting: "aws" },
    description: "Add custom logic to be executed after the ADMIN deployment process.",
    multiple: true,
    paramsSchema: ({ project }) => {
        return z.object({
            src: zodSrcPath({ project, abstraction: AdminAfterDeployAbstraction })
        });
    }
});
