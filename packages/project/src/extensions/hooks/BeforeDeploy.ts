import { defineExtension } from "~/defineExtension/index.js";
import { zodPathToAbstraction } from "~/defineExtension/zodTypes/zodPathToAbstraction.js";
import { BeforeDeploy as BeforeDeployAbstraction } from "~/abstractions/index.js";
import { z } from "zod";

export const BeforeDeploy = defineExtension({
    type: "Project/BeforeDeploy",
    tags: { runtimeContext: "project" },
    description: "Add custom logic to be executed before the PROJECT deploy process.",
    multiple: true,
    paramsSchema: ({ project, z }) => {
        return z.object({
            src: zodPathToAbstraction(BeforeDeployAbstraction, project)
        });
    }
});
