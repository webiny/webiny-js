import { defineExtension } from "~/defineExtension/index.js";
import { zodPathToAbstraction } from "~/defineExtension/zodTypes/zodPathToAbstraction.js";
import { AdminBeforeBuild as AdminBeforeBuildAbstraction } from "~/abstractions/index.js";

export const AdminBeforeBuild = defineExtension({
    type: "Admin/BeforeBuild",
    tags: { runtimeContext: "project", application: "admin" },
    description: "Add custom logic to be executed before the ADMIN build process.",
    multiple: true,
    paramsSchema: ({ project, z }) => {
        return z.object({
            src: zodPathToAbstraction(AdminBeforeBuildAbstraction, project)
        });
    }
});
