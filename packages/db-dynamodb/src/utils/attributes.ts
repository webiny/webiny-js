import { ContextInterface } from "@webiny/handler/types";
import { AttributePlugin, DefinitionParams } from "~/plugins/definitions/AttributePlugin";

/**
 * Will be removed in favor of directly assigning attributes to a certain entity when creating the storage operations.
 *
 * @deprecated
 */
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
