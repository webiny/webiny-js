import { defineExtension, zodPathToAbstraction } from "@webiny/project/extensions/index.js";
import { CliCommandFactory as CliCommandFactoryAbstraction } from "~/abstractions/index.js";
import { z } from "zod";

export const CliCommandFactory = defineExtension({
    type: "Cli/Command",
    tags: { runtimeContext: "cli" },
    description: "An extension for defining CLI commands.",
    multiple: true,
    paramsSchema: ({ project }) => {
        return z.object({
            src: zodPathToAbstraction(CliCommandFactoryAbstraction, project)
        });
    }
});
