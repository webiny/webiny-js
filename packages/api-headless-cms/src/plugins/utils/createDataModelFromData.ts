import { withName, withHooks } from "@webiny/commodo";
import { CmsModel, CmsModelFieldToCommodoFieldPlugin } from "@webiny/api-headless-cms/types";
import { GraphQLContext } from "@webiny/api/types";
import { GraphQLContext as I18NContext } from "@webiny/api-i18n/types";
import { GraphQLContext as CommodoContext } from "@webiny/api-plugin-commodo-db-proxy/types";
import { createValidation } from "./createValidation";
import { flow } from "lodash";

export const createDataModelFromData = (
    baseModel: Function,
    data: CmsModel,
    context: GraphQLContext & CommodoContext & I18NContext
) => {
    const plugins = context.plugins.byType<CmsModelFieldToCommodoFieldPlugin>(
        "cms-model-field-to-commodo-field"
    );

    // Create base model to be enhanced by field plugins
    const model = flow(
        withName(data.title),
        withHooks({
            async afterSave() {
                const SearchModel = context.models[data.modelId + "Search"];
                const locales = context.i18n.getLocales();

                for (let x = 0; x < locales.length; x++) {
                    const locale = locales[x];
                    const fieldValues = {};
                    for (let y = 0; y < data.fields.length; y++) {
                        const field = data.fields[y];
                        fieldValues[field.fieldId] = await this[field.fieldId].value(locale.code);
                    }

                    // Create/Update search entry
                    const entry = {
                        locale: locale.id,
                        model: data.modelId,
                        instance: this.id
                    };

                    const searchEntry = await SearchModel.findOne({ query: entry });
                    if (searchEntry) {
                        searchEntry.populate(fieldValues);
                        await searchEntry.save();
                    } else {
                        const searchEntry = new SearchModel();
                        searchEntry.populate({ ...entry, ...fieldValues });
                        await searchEntry.save();
                    }
                }
            }
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

        plugin.dataModel({
            context,
            field,
            model,
            validation: createValidation(field, context)
        });
    }

    return model;
};
