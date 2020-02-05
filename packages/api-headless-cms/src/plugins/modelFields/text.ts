import { CmsModelFieldToCommodoFieldPlugin } from "@webiny/api-headless-cms/types";
import { withFields, string } from "@webiny/commodo";
import { i18nField } from "./i18nFields";

const plugin: CmsModelFieldToCommodoFieldPlugin = {
    name: "cms-model-field-to-commodo-field-text",
    type: "cms-model-field-to-commodo-field",
    fieldType: "text",
    apply({ model, field, validation, context }) {
        return withFields({
            [field.fieldId]: i18nField({ field: string({ validation }), defaultValue: "", context })
        })(model);
    }
};

export default plugin;
