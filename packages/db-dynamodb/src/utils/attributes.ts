import { ContextInterface } from "@webiny/handler/types";
import { AttributePlugin, DefinitionParams } from "~/plugins/definitions/AttributePlugin";
import { PluginsContainer } from "@webiny/plugins";

export const getExtraAttributes = (
    context: ContextInterface | PluginsContainer,
    entity: string
): Record<string, DefinitionParams> => {
    const plugins = context instanceof PluginsContainer ? context : context.plugins;

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
