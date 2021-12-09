import { CliCommandSeedRunArgs, Logger } from "~/types";
import { CliContext } from "@webiny/cli/types";

export interface Params {
    context: CliContext;
    args: CliCommandSeedRunArgs;
    log: Logger;
}
export const validateArguments = (params: Params): boolean => {
    const { args, log } = params;
    /**
     * Validate existence of the env variable in the args.
     */
    if (args.env === undefined || args.env === null) {
        log.red(`Missing "--env" argument.`);
        return false;
    } else if (!args.env.trim()) {
        log.red(`You must type something into "--env" argument.`);
        return false;
    }
    /**
     * Validate existence of environment we are targeting.
     */
    // TODO env existence
    return true;
};
