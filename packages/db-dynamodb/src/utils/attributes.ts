import { Context } from "@webiny/handler/types";
import { AttributePlugin, DefinitionParams } from "~/plugins/definitions/AttributePlugin";
import { PluginsContainer } from "@webiny/plugins";

/**
 * Will be removed in favor of directly assigning attributes to a certain entity when creating the storage operations.
 *
 * @deprecated
 */
export const getExtraAttributes = (
    context: Context,
    entity: string
): Record<string, DefinitionParams> => {
    return getExtraAttributesFromPlugins(context.plugins, entity);
};

export const getExtraAttributesFromPlugins = (
    plugins: PluginsContainer,
    entity: string
): Record<string, DefinitionParams> => {
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
