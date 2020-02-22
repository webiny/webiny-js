import { CmsModelFieldToCommodoFieldPlugin } from "@webiny/api-headless-cms/types";
import { withFields, int } from "@webiny/commodo";
import { i18nField } from "./i18nFields";

const plugin: CmsModelFieldToCommodoFieldPlugin = {
    name: "cms-model-field-to-commodo-field-integer",
    type: "cms-model-field-to-commodo-field",
    fieldType: "integer",
    isSortable: true,
    dataModel({ model, field, validation, context }) {
        return withFields({
            [field.fieldId]: i18nField({
                field: int({ validation }),
                context
            })
        })(model);
    },
    searchModel({ model, field, validation }) {
        return withFields({
            [field.fieldId]: int({ validation })
        })(model);
    }
};

export default plugin;
