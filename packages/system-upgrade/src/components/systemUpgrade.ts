import { ContextInterface } from "@webiny/handler/types";
import WebinyError from "@webiny/error";
import { filterPlugins, parseCodeVersion } from "./helpers";
import { UpgradeSystemResult, UpgradeSystemResults } from "@webiny/system-upgrade/types";

/**
 * Run the loaded upgrade plugins.
 * It will throw an error if plugin is greater version than the WEBINY_VERSION.
 * It will throw an error if system upgrade fails.
 */
export const systemUpgrade = async <T extends ContextInterface>(
    context: T
): Promise<UpgradeSystemResults<T>> => {
    const codeVersion = parseCodeVersion(context);

    const plugins = await filterPlugins(context, codeVersion);

    const results: Record<string, UpgradeSystemResult> = {};
    for (const plugin of plugins) {
        try {
            const message = await plugin.apply(context, codeVersion);
            results[plugin.version.format()] = {
                message: message || "success"
            };
        } catch (ex) {
            throw new WebinyError(
                "Could not finish the system upgrade. A plugin error occurred.",
                "PLUGIN_APPLY_ERROR",
                {
                    version: codeVersion,
                    plugin: {
                        name: plugin.name,
                        version: plugin.version.format()
                    },
                    error: {
                        message: ex.message,
                        code: ex.code,
                        data: ex.data
                    }
                }
            );
        }
    }
    return {
        plugins,
        results
    } as UpgradeSystemResults<T>;
};
