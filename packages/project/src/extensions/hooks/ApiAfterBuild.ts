import { defineExtension } from "~/defineExtension/index.js";
import { type ExtensionInstanceModelContext } from "~/defineExtension/index.js";
import { zodPathToAbstraction } from "~/defineExtension/zodTypes/zodPathToAbstraction.js";
import { ApiAfterBuild as ApiAfterBuildAbstraction } from "~/abstractions/index.js";
import { z } from "zod";

export const ApiAfterBuild = defineExtension({
    type: "Api/AfterBuild",
    tags: { runtimeContext: "project", application: "api" },
    description: "Add custom logic to be executed after the API build process.",
    multiple: true,
    paramsSchema: ({ project }: ExtensionInstanceModelContext) => {
        return z.object({
            src: zodPathToAbstraction(ApiAfterBuildAbstraction, project)
        });
    }
});
