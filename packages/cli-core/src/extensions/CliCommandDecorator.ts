import { defineExtension, zodPathToAbstraction } from "@webiny/project/extensions/index.js";
import { CliCommand } from "~/abstractions/index.js";
import { z } from "zod";

export const cliCommandDecorator = defineExtension({
    type: "cliCommandDecorator",
    tags: { runtimeContext: "cli" },
    description: "Decorates an existing CLI command.",
    multiple: true,
    paramsSchema: ({ project }) => {
        return z.object({
            src: zodPathToAbstraction(CliCommand, project)
        });
    }
});
