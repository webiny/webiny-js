import { CmsModelFieldToCommodoFieldPlugin } from "@webiny/api-headless-cms/types";
import { withFields, object } from "@webiny/commodo";
import { i18nField } from "./i18nFields";

const plugin: CmsModelFieldToCommodoFieldPlugin = {
    name: "cms-model-field-to-commodo-field-rich-text",
    type: "cms-model-field-to-commodo-field",
    fieldType: "rich-text",
    dataModel({ model, field, validation, context }) {
        withFields({
            [field.fieldId]: i18nField({
                field: object({ validation, list: field.multipleValues }),
                context
            })
        })(model);
    }
};

export default plugin;
