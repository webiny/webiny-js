import { z } from "zod";
import { defineExtension } from "@webiny/project/defineExtension/index.js";
import { zodPathToAbstraction } from "@webiny/project/defineExtension/zodTypes/zodPathToAbstraction.js";
import { ApiPulumi as ApiPulumiAbstraction } from "~/abstractions/features/pulumi/index.js";

export const ApiPulumi = defineExtension({
    type: "Api/Pulumi",
    tags: { runtimeContext: "project", appName: "api" },
    description: "Modify Api app's cloud infrastructure using Pulumi.",
    multiple: true,
    paramsSchema: ({ project }) => {
        return z.object({
            src: zodPathToAbstraction(ApiPulumiAbstraction, project)
        });
    }
});
