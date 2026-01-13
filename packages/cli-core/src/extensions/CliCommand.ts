import { defineExtension, zodPathToAbstraction } from "@webiny/project/extensions/index.js";
import { CliCommand as CliCommandAbstraction } from "~/abstractions/index.js";

export const CliCommand = defineExtension({
    type: "Cli/Command",
    tags: { runtimeContext: "cli" },
    description: "An extension for defining CLI commands.",
    multiple: true,
    paramsSchema: ({ project }) => {
        return {
            src: zodPathToAbstraction(CliCommandAbstraction, project)
        };
    }
});
