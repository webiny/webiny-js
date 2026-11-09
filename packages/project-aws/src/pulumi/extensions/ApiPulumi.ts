import { z } from "zod";
import { defineExtension } from "@webiny/project/defineExtension/index.js";
import { zodSrcPath } from "@webiny/project/defineExtension/zodTypes/zodSrcPath.js";
import { ApiPulumi as ApiPulumiAbstraction } from "@webiny/project-aws-extensions/abstractions/features/pulumi/index.js";

export const ApiPulumi = defineExtension({
    type: "Api/Pulumi",
    tags: { runtimeContext: "project", appName: "api", hosting: "aws" },
    description: "Modify Api app's cloud infrastructure using Pulumi.",
    multiple: true,
    paramsSchema: ({ project }) => {
        return z.object({
            src: zodSrcPath({ project, abstraction: ApiPulumiAbstraction })
        });
    }
});
