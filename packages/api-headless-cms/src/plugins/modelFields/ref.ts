import { CmsModelFieldToCommodoFieldPlugin } from "@webiny/api-headless-cms/types";
import { withFields, ref } from "@webiny/commodo";
import { i18nField } from "./i18nFields";

const plugin: CmsModelFieldToCommodoFieldPlugin = {
    name: "cms-model-field-to-commodo-field-ref",
    type: "cms-model-field-to-commodo-field",
    fieldType: "ref",
    sortable: false,
    apply({ model, field, validation, context }) {
        const { type, modelId } = field.settings;

        if (type === "one") {
            return withFields(instance => ({
                [field.fieldId]: i18nField({
                    field: ref({
                        instanceOf: context.models[modelId],
                        parent: instance,
                        validation
                    }),
                    defaultValue: null,
                    context
                })
            }))(model);
        }

        if (type === "many") {
            return withFields(instance => ({
                [field.fieldId]: i18nField({
                    field: ref({
                        list: true,
                        instanceOf: context.models[modelId],
                        parent: instance,
                        validation
                    }),
                    defaultValue: null,
                    context
                })
            }))(model);
        }

        return model;
    }
};

export default plugin;
