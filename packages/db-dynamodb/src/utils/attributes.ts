import { ContextInterface } from "@webiny/handler/types";
import { AttributePlugin, DefinitionParams } from "~/plugins";

export const getExtraAttributes = (
    context: ContextInterface,
    entity: string
): Record<string, DefinitionParams> => {
    return context.plugins
        .byType<AttributePlugin>(AttributePlugin.type)
        .filter(plugin => plugin.entity === entity)
        .reduce((attributes, plugin) => {
            return {
                ...attributes,
                ...plugin.getDefinition()
            };
        }, {});
};
