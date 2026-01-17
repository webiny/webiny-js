import { defineExtension } from "~/defineExtension/index.js";
import { zodSrcPath } from "~/defineExtension/zodTypes/zodSrcPath.js";
import { AdminAfterDeploy as AdminAfterDeployAbstraction } from "~/abstractions/index.js";
import { z } from "zod";

export const AdminAfterDeploy = defineExtension({
    type: "Admin/AfterDeploy",
    tags: { runtimeContext: "project", application: "admin" },
    description: "Add custom logic to be executed after the ADMIN deployment process.",
    multiple: true,
    paramsSchema: ({ project }) => {
        return z.object({
            src: zodSrcPath({ project, abstraction: AdminAfterDeployAbstraction })
        });
    }
});
