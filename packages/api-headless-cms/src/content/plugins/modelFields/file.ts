import { CmsModelFieldToCommodoFieldPlugin } from "@webiny/api-headless-cms/types";
import { withFields } from "@webiny/commodo";
import { i18nField } from "./i18nFields";

enum FILE_TYPE {
    SINGLE_FILE = "single",
    MULTIPLE_FILE = "multiple"
}

function getFileField({ context, field, validation }) {
    const type: FILE_TYPE = field.settings.type;
    let cField;
    switch (type) {
        case FILE_TYPE.SINGLE_FILE:
            cField = context.commodo.fields.id();
            break;
        case FILE_TYPE.MULTIPLE_FILE:
            cField = context.commodo.fields.id();
            break;
    }

    return cField;
}

const plugin: CmsModelFieldToCommodoFieldPlugin = {
    name: "cms-model-field-to-commodo-field-file",
    type: "cms-model-field-to-commodo-field",
    fieldType: "file",
    dataModel({ model, field, validation, context }) {
        withFields({
            [field.fieldId]: i18nField({
                field: getFileField({ context, field, validation }),
                context
            })
        })(model);
    },
    searchModel({ model, field, context }) {
        withFields({
            [field.fieldId]: getFileField({ context, field, validation: false })
        })(model);
    }
};

export default plugin;
