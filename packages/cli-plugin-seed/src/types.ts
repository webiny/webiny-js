import { CliContext } from "@webiny/cli/types";
import { Plugin, PluginsContainer } from "@webiny/plugins/types";

export interface CliSeedContext extends CliContext {
    plugins: PluginsContainer;
}
/**
 * Arguments for CliPlugin.create
 *
 * @category Cli
 */
export interface CliCommandPluginArgs {
    yargs: any;
    context: CliSeedContext;
}

export interface CliCommandSeedRunArgs {
    env: string;
    skipWarning: boolean;
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
