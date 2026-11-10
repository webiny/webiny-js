import { z } from "zod";
import { defineExtension } from "@webiny/project/defineExtension/index.js";
import { zodSrcPath } from "@webiny/project/defineExtension/zodTypes/zodSrcPath.js";
import { CorePulumi as CorePulumiAbstraction } from "@webiny/project-extensions-aws/abstractions/features/pulumi/index.js";

export const CorePulumi = defineExtension({
    type: "Core/Pulumi",
    tags: { runtimeContext: "project", appName: "core", hosting: "aws" },
    description: "Modify Core app's cloud infrastructure using Pulumi.",
    multiple: true,
    paramsSchema: ({ project }) => {
        return z.object({
            src: zodSrcPath({ project, abstraction: CorePulumiAbstraction })
        });
    }
});
