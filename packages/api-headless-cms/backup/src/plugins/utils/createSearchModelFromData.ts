import { withName, withFields, string } from "@webiny/commodo";
import { CmsModel, CmsModelFieldToCommodoFieldPlugin } from "@webiny/api-headless-cms/types";
import { GraphQLContext } from "@webiny/api/types";
import { GraphQLContext as I18NContext } from "@webiny/api-i18n/types";
import { GraphQLContext as CommodoContext } from "@webiny/api-plugin-commodo-db-proxy/types";
import { flow } from "lodash";
import { createValidation } from "@webiny/api-headless-cms/plugins/utils/createValidation";

export const createSearchModelFromData = (
    baseModel: Function,
    data: CmsModel,
    context: GraphQLContext & CommodoContext & I18NContext
) => {
    const plugins = context.plugins.byType<CmsModelFieldToCommodoFieldPlugin>(
        "cms-model-field-to-commodo-field"
    );

    // Create base model to be enhanced by field plugins
    const model = flow(
        withName(data.title + "Search"),
        withFields({
            model: string(),
            instance: context.commodo.fields.id(),
            locale: string()
        })
    )(baseModel) as Function;

    for (let i = 0; i < data.fields.length; i++) {
        const field = data.fields[i];
        const plugin = plugins.find(pl => pl.fieldType === field.type);
        if (!plugin) {
            throw Error(
                `Missing "cms-model-field-to-commodo-field" plugin for field type "${field.type}"`
            );
        }

        if (typeof plugin.searchModel === "function") {
            plugin.searchModel({
                context,
                field,
                model
            });
        }
    }

    return model;
};
