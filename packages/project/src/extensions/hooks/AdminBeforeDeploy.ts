import { defineExtension } from "~/defineExtension/index.js";
import { zodPathToAbstraction } from "~/defineExtension/zodTypes/zodPathToAbstraction.js";
import { AdminBeforeDeploy as AdminBeforeDeployAbstraction } from "~/abstractions/index.js";

export const AdminBeforeDeploy = defineExtension({
    type: "Admin/BeforeDeploy",
    tags: { runtimeContext: "project", application: "admin" },
    description: "Add custom logic to be executed before the ADMIN deployment process.",
    multiple: true,
    paramsSchema: ({ project }) => {
        return {
            src: zodPathToAbstraction(AdminBeforeDeployAbstraction, project)
        };
    }
});
