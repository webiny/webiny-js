import { pipe, withName, withFields, string, boolean } from "@webiny/commodo";
import {
    CmsGraphQLContext,
    CmsModel,
    CmsModelFieldToCommodoFieldPlugin
} from "@webiny/api-headless-cms/types";

export const createSearchModelFromData = (
    baseModel: Function,
    data: CmsModel,
    context: CmsGraphQLContext
) => {
    const plugins = context.plugins.byType<CmsModelFieldToCommodoFieldPlugin>(
        "cms-model-field-to-commodo-field"
    );

    // Create base model to be enhanced by field plugins
    const model = pipe(
        withName(`${data.title}Search`),
        withFields({
            revision: context.commodo.fields.id(),
            latestVersion: boolean(),
            published: boolean(),
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
