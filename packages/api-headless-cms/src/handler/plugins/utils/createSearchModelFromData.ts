import { pipe, withName, withFields, string, boolean, setOnce } from "@webiny/commodo";
import {
    CmsGraphQLContext,
    CmsModel,
    CmsModelFieldToCommodoFieldPlugin
} from "@webiny/api-headless-cms/types";

import { withModelFiltering } from "./withModelFiltering";

export const createSearchModelFromData = (
    createBase: Function,
    data: CmsModel,
    context: CmsGraphQLContext
) => {
    const plugins = context.plugins.byType<CmsModelFieldToCommodoFieldPlugin>(
        "cms-model-field-to-commodo-field"
    );

    // Create base model to be enhanced by field plugins
    const model = pipe(
        withName("CmsContentEntrySearch"),
        withFields({
            revision: context.commodo.fields.id(),
            latestVersion: boolean(),
            published: boolean(),
            locale: string(),
            model: setOnce()(string({ value: data.modelId }))
        }),
        withModelFiltering(data.modelId)
    )(createBase()) as Function;

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
