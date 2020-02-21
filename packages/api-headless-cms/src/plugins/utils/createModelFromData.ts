import { withName, withHooks } from "@webiny/commodo";
import { CmsModel, CmsModelFieldToCommodoFieldPlugin } from "@webiny/api-headless-cms/types";
import { GraphQLContext } from "@webiny/api/types";
import { GraphQLContext as I18NContext } from "@webiny/api-i18n/types";
import { GraphQLContext as CommodoContext } from "@webiny/api-plugin-commodo-db-proxy/types";
import { createValidation } from "./createValidation";
import { flow } from "lodash";

export const createModelFromData = (
    baseModel: Function,
    data: CmsModel,
    context: GraphQLContext & CommodoContext & I18NContext
) => {
    const plugins = context.plugins.byType<CmsModelFieldToCommodoFieldPlugin>(
        "cms-model-field-to-commodo-field"
    );

    // Create base model to be enhanced by field plugins
    let base = flow(
        withName(data.title),
        withHooks({
            async afterSave() {
                const { CmsFieldValueModel } = context.models;
                const locales = context.i18n.getLocales();
                for (let x = 0; x < locales.length; x++) {
                    const locale = locales[x];
                    for (let y = 0; y < data.fields.length; y++) {
                        const field = data.fields[y];
                        const fieldPlugin = plugins.find(pl => pl.fieldType === field.type);

                        if (!fieldPlugin.sortable) {
                            continue;
                        }

                        const fieldValue = new CmsFieldValueModel();
                        const value = await this[field.fieldId].value(locale.code);

                        if (typeof value === "undefined") {
                            continue;
                        }

                        fieldValue.populate({
                            locale: locale.id,
                            field: field.fieldId,
                            value,
                            ref: this.id,
                            modelId: data.modelId,
                            modelName: data.title
                        });
                        await fieldValue.save();
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

        base = plugin.apply({
            context,
            field,
            model: base,
            validation: createValidation(field, context)
        });
    }

    return base;
};
