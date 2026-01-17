import { z } from "zod";
import { defineExtension } from "~/defineExtension/index.js";
import { zodSrcPath } from "~/defineExtension/zodTypes/zodSrcPath.js";
import { AdminPulumi as AdminPulumiAbstraction } from "~/abstractions/features/pulumi/index.js";

export const AdminPulumi = defineExtension({
    type: "Admin/Pulumi",
    tags: { runtimeContext: "project", appName: "admin" },
    description: "Modify Admin app's cloud infrastructure using Pulumi.",
    multiple: true,
    paramsSchema: ({ project }) => {
        return z.object({
            src: zodSrcPath({ project, abstraction: AdminPulumiAbstraction })
        });
    }
});
