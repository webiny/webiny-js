import { Context } from "@webiny/api/types";
import { AttributePlugin } from "~/plugins/definitions/AttributePlugin";
import { PluginsContainer } from "@webiny/plugins";

/**
 * Will be removed in favor of directly assigning attributes to a certain entity when creating the storage operations.
 *
 * @deprecated
 */
export const getExtraAttributes = (
    context: Context,
    entity: string
): Record<string, AttributePlugin["_params"]> => {
    return getExtraAttributesFromPlugins(context.plugins, entity);
};

export const getExtraAttributesFromPlugins = (
    plugins: PluginsContainer,
    entity: string
): Record<string, AttributePlugin["_params"]> => {
    return plugins
        .byType<AttributePlugin>(AttributePlugin.type)
        .filter(plugin => plugin.entity === entity)
        .reduce((attributes, plugin) => {
            return {
                ...attributes,
                ...plugin.getDefinition()
            };
        }, {});
};
