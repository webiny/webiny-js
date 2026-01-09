import { defineExtension } from "~/defineExtension/index.js";
import { zodPathToAbstraction } from "~/defineExtension/zodTypes/zodPathToAbstraction.js";
import { AdminAfterBuild as AdminAfterBuildAbstraction } from "~/abstractions/index.js";

export const AdminAfterBuild = defineExtension({
    type: "Admin/AfterBuild",
    tags: { runtimeContext: "project", application: "admin" },
    description: "Add custom logic to be executed after the ADMIN build process.",
    multiple: true,
    paramsSchema: ({ project }) => {
        return {
            src: zodPathToAbstraction(AdminAfterBuildAbstraction, project)
        };
    }
});
