import { ContextInterface } from "@webiny/handler/types";
import { filterPlugins, parseCodeVersion } from "./helpers";
import { compare as semverCompare } from "semver";
import { SystemUpgrade } from "../types";

/**
 * Fetches all the system upgrade plugins filtered by isApplicable() and sorted from lowest to highest version.
 */
export const systemUpgradePlugins = async <T extends ContextInterface>(
    context: T
): Promise<SystemUpgrade<T>[]> => {
    const codeVersion = parseCodeVersion(context);
    const plugins = await filterPlugins(context, codeVersion);

    return plugins
        .sort((a, b) => {
            return semverCompare(a.version, b.version);
        })
        .map(plugin => {
            return {
                ...plugin,
                version: plugin.version.format()
            } as SystemUpgrade<T>;
        });
};
