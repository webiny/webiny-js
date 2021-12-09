import { CliContext } from "@webiny/cli/types";
import { Plugin } from "@webiny/plugins/types";

/**
 * Arguments for CliPlugin.create
 *
 * @category Cli
 */
export interface CliCommandPluginArgs {
    yargs: any;
    context: CliContext;
}

export interface CliCommandSeedRunArgs {
    env: string;
}

/**
 * A plugin defining cli-command type.
 *
 * @category Plugin
 * @category Cli
 */
export interface CliCommandPlugin extends Plugin {
    type: "cli-command";
    name: string;
    create: (args: CliCommandPluginArgs) => void;
}

export interface Logger {
    red: (text: string) => void;
    green: (text: string) => void;
    yellow: (text: string) => void;
}
