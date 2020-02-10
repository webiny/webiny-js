import { CmsModelFieldToCommodoFieldPlugin } from "@webiny/api-headless-cms/types";
import { withFields, int } from "@webiny/commodo";
import { i18nField } from "./i18nFields";

const plugin: CmsModelFieldToCommodoFieldPlugin = {
    name: "cms-model-field-to-commodo-field-integer",
    type: "cms-model-field-to-commodo-field",
    fieldType: "integer",
    apply({ model, field, validation, context }) {
        return withFields({
            [field.fieldId]: i18nField({
                field: int({ validation }),
                defaultValue: null,
                context
            })
        })(model);
    }
};

export default plugin;
