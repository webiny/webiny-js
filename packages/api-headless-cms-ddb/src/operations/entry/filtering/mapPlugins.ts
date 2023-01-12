import { Plugin, PluginsContainer } from "@webiny/plugins/types";
import WebinyError from "@webiny/error";

interface Params {
    plugins: PluginsContainer;
    type: string;
    property: string;
}
export const getMappedPlugins = <T extends Plugin>(params: Params) => {
    const { plugins: pluginsContainer, type, property } = params;
    const plugins = pluginsContainer.byType<T>(type);
    if (plugins.length === 0) {
        return {};
    }
    return plugins.reduce<Record<string, T>>((collection, plugin) => {
        const key: keyof typeof plugin = plugin[property];
        if (typeof key !== "string") {
            throw new WebinyError(
                "Property to map the plugins on must be a string.",
                "PLUGIN_PROPERTY_ERROR",
                {
                    type,
                    property
                }
            );
        }
        collection[key] = plugin;
        return collection;
    }, {});
};
