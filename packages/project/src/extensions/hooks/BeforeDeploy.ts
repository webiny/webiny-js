import { defineExtension } from "~/defineExtension/index.js";
import { zodSrcPath } from "~/defineExtension/zodTypes/zodSrcPath.js";
import { BeforeDeploy as BeforeDeployAbstraction } from "~/abstractions/index.js";
import { z } from "zod";

export const BeforeDeploy = defineExtension({
    type: "Project/BeforeDeploy",
    tags: { runtimeContext: "project" },
    description: "Add custom logic to be executed before the PROJECT deploy process.",
    multiple: true,
    paramsSchema: ({ project }) => {
        return z.object({
            src: zodSrcPath({ project, abstraction: BeforeDeployAbstraction })
        });
    }
});
