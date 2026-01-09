import { z } from "zod";
import { defineExtension } from "~/defineExtension/index.js";
import { zodPathToAbstraction } from "~/defineExtension/zodTypes/zodPathToAbstraction.js";
import { CorePulumi as CorePulumiAbstraction } from "~/abstractions/features/pulumi/index.js";

export const CorePulumi = defineExtension({
    type: "Core/Pulumi",
    tags: { runtimeContext: "project", appName: "core" },
    description: "Modify Core app's cloud infrastructure using Pulumi.",
    multiple: true,
    paramsSchema: ({ project, z }) => {
        return z.object({
            src: zodPathToAbstraction(CorePulumiAbstraction, project)
        });
    }
});
