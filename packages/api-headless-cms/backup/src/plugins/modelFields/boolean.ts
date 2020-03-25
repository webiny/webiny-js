import { CmsModelFieldToCommodoFieldPlugin } from "@webiny/api-headless-cms/types";
import { withFields, boolean } from "@webiny/commodo";
import { i18nField } from "./i18nFields";

const plugin: CmsModelFieldToCommodoFieldPlugin = {
    name: "cms-model-field-to-commodo-field-boolean",
    type: "cms-model-field-to-commodo-field",
    fieldType: "boolean",
    isSortable: true,
    dataModel({ model, field, validation, context }) {
        withFields({
            [field.fieldId]: i18nField({
                field: boolean({ validation }),
                context
            })
        })(model);
    },
    searchModel({ model, field, validation }) {
        withFields({
            [field.fieldId]: boolean({ validation })
        })(model);
    }
};

export default plugin;
