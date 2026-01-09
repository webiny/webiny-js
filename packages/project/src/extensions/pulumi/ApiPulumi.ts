import { z } from "zod";
import { type ExtensionInstanceModelContext } from "~/defineExtension/index.js";
import { defineExtension } from "~/defineExtension/index.js";
import { zodPathToAbstraction } from "~/defineExtension/zodTypes/zodPathToAbstraction.js";
import { ApiPulumi as ApiPulumiAbstraction } from "~/abstractions/features/pulumi/index.js";

export const ApiPulumi = defineExtension({
    type: "Api/Pulumi",
    tags: { runtimeContext: "project", appName: "api" },
    description: "Modify Api app's cloud infrastructure using Pulumi.",
    multiple: true,
    paramsSchema: ({ project }: ExtensionInstanceModelContext) => {
        return z.object({
            src: zodPathToAbstraction(ApiPulumiAbstraction, project)
        });
    }
});
