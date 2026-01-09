import { defineExtension } from "~/defineExtension/index.js";
import { zodPathToAbstraction } from "~/defineExtension/zodTypes/zodPathToAbstraction.js";
import { AdminAfterDeploy as AdminAfterDeployAbstraction } from "~/abstractions/index.js";

export const AdminAfterDeploy = defineExtension({
    type: "Admin/AfterDeploy",
    tags: { runtimeContext: "project", application: "admin" },
    description: "Add custom logic to be executed after the ADMIN deployment process.",
    multiple: true,
    paramsSchema: ({ project, z }) => {
        return z.object({
            src: zodPathToAbstraction(AdminAfterDeployAbstraction, project)
        });
    }
});
