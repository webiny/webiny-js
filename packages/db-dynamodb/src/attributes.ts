import { ContextInterface } from "@webiny/handler/types";
import { DynamoDbAttributePluginParams } from "~/types";
import { DynamoDbAttributePlugin } from "~/plugins";

export const getExtraAttributes = (
    context: ContextInterface,
    entity: string
): Record<string, DynamoDbAttributePluginParams> => {
    return context.plugins
        .byType<DynamoDbAttributePlugin>(DynamoDbAttributePlugin.type)
        .filter(plugin => plugin.entity === entity)
        .reduce((attr, plugin) => {
            attr[plugin.attribute] = plugin.getDefinition();

            return attr;
        }, {});
};
