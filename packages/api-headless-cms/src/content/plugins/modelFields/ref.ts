import { CmsModelFieldToCommodoFieldPlugin } from "@webiny/api-headless-cms/types";
import { withFields, ref } from "@webiny/commodo";
import { i18nField } from "./i18nFields";

const plugin: CmsModelFieldToCommodoFieldPlugin = {
    name: "cms-model-field-to-commodo-field-ref",
    type: "cms-model-field-to-commodo-field",
    fieldType: "ref",
    dataModel({ model, field, validation, context }) {
        const { modelId } = field.settings;

        return withFields(instance => ({
            [field.fieldId]: i18nField({
                field: ref({
                    list: field.multipleValues,
                    instanceOf: context.models[modelId],
                    parent: instance,
                    validation
                }),
                context
            })
        }))(model);
    }
};

export default plugin;
