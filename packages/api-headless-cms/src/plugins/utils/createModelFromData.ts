import { flow } from "lodash";
import { withName, withFields } from "@webiny/commodo";
import { CmsModel, CmsModelFieldToCommodoFieldPlugin } from "@webiny/api-headless-cms/types";
import { GraphQLContext } from "@webiny/api/types";
import { GraphQLContext as I18NContext } from "@webiny/api-i18n/types";
import { GraphQLContext as CommodoContext } from "@webiny/api-plugin-commodo-db-proxy/types";
import { createValidation } from "./createValidation";

export const createModelFromData = (
    baseModel: Function,
    data: CmsModel,
    context: GraphQLContext & CommodoContext & I18NContext
) => {
    const plugins = context.plugins.byType<CmsModelFieldToCommodoFieldPlugin>(
        "cms-model-field-to-commodo-field"
    );

    // Create base model to be enhanced by field plugins
    let base = withName(data.title)(baseModel);

    for (let i = 0; i < data.fields.length; i++) {
        const field = data.fields[i];
        const plugin = plugins.find(pl => pl.fieldType === field.type);
        if (!plugin) {
            throw Error(
                `Missing "cms-model-field-to-commodo-field" for field type "${field.type}"`
            );
        }

        base = plugin.apply({
            context,
            field,
            model: base,
            validation: createValidation(field, context)
        });
    }

    return base;
};
