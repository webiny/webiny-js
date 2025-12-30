import { defineExtension, zodPathToAbstraction } from "@webiny/project/extensions/index.js";
import { OnEntryBeforeCreate as OnEntryBeforeCreateAbstraction } from "~/abstractions/index.js";
import { z } from "zod";

export const OnEntryBeforeCreate = defineExtension({
    type: "Cms/Entry/OnEntryBeforeCreate",
    tags: { runtimeContext: "app-build", appName: "api" },
    description: "Add custom logic to be executed before the CMS entry is created.",
    multiple: true,
    paramsSchema: ({ project }) => {
        return z.object({
            src: zodPathToAbstraction(OnEntryBeforeCreateAbstraction, project)
        });
    }
});
