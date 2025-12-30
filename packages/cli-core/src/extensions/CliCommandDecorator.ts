import { defineExtension, zodPathToAbstraction } from "@webiny/project/extensions/index.js";
import { CliCommand as CliCommandAbstraction } from "~/abstractions/index.js";
import { z } from "zod";

export const CliCommandDecorator = defineExtension({
    type: "cliCommandDecorator",
    tags: { runtimeContext: "cli" },
    description: "Decorates an existing CLI command.",
    multiple: true,
    paramsSchema: ({ project }) => {
        return z.object({
            src: zodPathToAbstraction(CliCommandAbstraction, project)
        });
    }
});
