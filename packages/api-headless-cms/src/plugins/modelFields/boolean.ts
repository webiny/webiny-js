import { CmsModelFieldToCommodoFieldPlugin } from "@webiny/api-headless-cms/types";
import { withFields, boolean } from "@webiny/commodo";
import { i18nField } from "./i18nFields";

const plugin: CmsModelFieldToCommodoFieldPlugin = {
    name: "cms-model-field-to-commodo-field-boolean",
    type: "cms-model-field-to-commodo-field",
    fieldType: "boolean",
    sortable: true,
    apply({ model, field, validation, context }) {
        return withFields({
            [field.fieldId]: i18nField({
                field: boolean({ validation }),
                defaultValue: false,
                context
            })
        })(model);
    }
};

export default plugin;
