import { z } from "zod";
import { defineExtension } from "~/defineExtension/index.js";
import { zodSrcPath } from "~/defineExtension/zodTypes/zodSrcPath.js";
import { CorePulumi as CorePulumiAbstraction } from "~/abstractions/features/pulumi/index.js";

export const CorePulumi = defineExtension({
    type: "Core/Pulumi",
    tags: { runtimeContext: "project", appName: "core" },
    description: "Modify Core app's cloud infrastructure using Pulumi.",
    multiple: true,
    paramsSchema: ({ project }) => {
        return z.object({
            src: zodSrcPath({ project, abstraction: CorePulumiAbstraction })
        });
    }
});
