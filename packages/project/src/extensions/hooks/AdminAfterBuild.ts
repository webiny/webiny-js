import { defineExtension } from "~/defineExtension/index.js";
import { zodSrcPath } from "~/defineExtension/zodTypes/zodSrcPath.js";
import { AdminAfterBuild as AdminAfterBuildAbstraction } from "~/abstractions/index.js";
import { z } from "zod";

export const AdminAfterBuild = defineExtension({
    type: "Admin/AfterBuild",
    tags: { runtimeContext: "project", application: "admin" },
    description: "Add custom logic to be executed after the ADMIN build process.",
    multiple: true,
    paramsSchema: ({ project }) => {
        return z.object({
            src: zodSrcPath({ project, abstraction: AdminAfterBuildAbstraction })
        });
    }
});
