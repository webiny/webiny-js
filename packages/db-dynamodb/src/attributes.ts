import { ContextInterface } from "@webiny/handler/types";
import { DynamoDbAttributePlugin } from "~/plugins";
import { DynamoDbAttributePluginAttributeParams } from "~/types";

export const getExtraAttributes = (
    context: ContextInterface,
    entity: string
): Record<string, DynamoDbAttributePluginAttributeParams> => {
    return context.plugins
        .byType<DynamoDbAttributePlugin>(DynamoDbAttributePlugin.type)
        .filter(plugin => plugin.entity === entity)
        .reduce((attributes, plugin) => {
            return {
                ...attributes,
                ...plugin.getDefinition()
            };
        }, {});
};
