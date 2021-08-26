import { SettingsStorageOperationsProviderPlugin } from "~/plugins/SettingsStorageOperationsProviderPlugin";
import WebinyError from "@webiny/error";
import { SettingsStorageOperations, PbContext } from "~/types";

export const createSettingsStorageOperations = async (
    context: PbContext
): Promise<SettingsStorageOperations> => {
    const pluginType = SettingsStorageOperationsProviderPlugin.type;

    const providerPlugin: SettingsStorageOperationsProviderPlugin = context.plugins
        .byType<SettingsStorageOperationsProviderPlugin>(pluginType)
        .find(() => true);

    if (!providerPlugin) {
        throw new WebinyError(`Missing "${pluginType}" plugin.`, "PLUGIN_NOT_FOUND", {
            type: pluginType
        });
    }

    return await providerPlugin.provide({
        context
    });
};
