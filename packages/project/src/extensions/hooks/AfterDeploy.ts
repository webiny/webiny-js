import { defineExtension } from "~/defineExtension/index.js";
import { type ExtensionInstanceModelContext } from "~/defineExtension/index.js";
import { zodPathToAbstraction } from "~/defineExtension/zodTypes/zodPathToAbstraction.js";
import { AfterDeploy as AfterDeployAbstraction } from "~/abstractions/index.js";
import { z } from "zod";

export const AfterDeploy = defineExtension({
    type: "Project/AfterDeploy",
    tags: { runtimeContext: "project" },
    description: "Add custom logic to be executed after the PROJECT deploy process.",
    multiple: true,
    paramsSchema: ({ project }: ExtensionInstanceModelContext) => {
        return z.object({
            src: zodPathToAbstraction(AfterDeployAbstraction, project)
        });
    }
});
