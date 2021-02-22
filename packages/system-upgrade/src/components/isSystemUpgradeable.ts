import { ContextInterface } from "@webiny/handler/types";
import WebinyError from "@webiny/error";
import {
    getSystemUpgradePlugins,
    parseCodeVersion,
    validateCodeVersionAgainstPlugin
} from "./helpers";

/**
 * Check if system is upgradeable by at least one upgrade plugin.
 */
export const isSystemUpgradeable = async <T extends ContextInterface>(
    context: T
): Promise<boolean> => {
    const codeVersion = parseCodeVersion(context);
    const plugins = getSystemUpgradePlugins(context);
    for (const plugin of plugins) {
        // there should be no plugin that has greater version than the codeVersion
        validateCodeVersionAgainstPlugin(codeVersion, plugin);
        try {
            const result = await plugin.isApplicable(context, codeVersion);
            if (result) {
                return true;
            }
        } catch (ex) {
            throw new WebinyError(
                "Could not check if plugin is applicable to run the upgrade.",
                "PLUGIN_IS_APPLICABLE_ERROR",
                {
                    version: codeVersion,
                    plugin: {
                        name: plugin.name,
                        version: plugin.version.format()
                    }
                }
            );
        }
    }
    return false;
};
