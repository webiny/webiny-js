import { CmsModelFieldToCommodoFieldPlugin } from "@webiny/api-headless-cms/types";
import { withFields, string, onSet, onGet, pipe } from "@webiny/commodo";
import { i18nField } from "./i18nFields";

enum FILE_TYPE {
    SINGLE_FILE = "single",
    MULTIPLE_FILE = "multiple"
}

function getFileField({ field, validation, context }) {
    const type: FILE_TYPE = field.settings.type;
    let cField;
    switch (type) {
        case FILE_TYPE.SINGLE_FILE:
            cField = pipe(
                onGet(value => {
                    // Prepend `srcPrefix`
                    const settings = context.files.getFileSettings();
                    return settings.srcPrefix + value;
                }),
                onSet(value => {
                    // Only save `key`
                    const settings = context.files.getFileSettings();
                    if (value.includes(settings.srcPrefix)) {
                        const [, key] = value.split(settings.srcPrefix);
                        return key;
                    }
                    return value;
                })
            )(string({ validation }));
            break;
        case FILE_TYPE.MULTIPLE_FILE:
            cField = string({ validation });
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
                field: getFileField({ field, validation, context }),
                context
            })
        })(model);
    },
    searchModel({ model, field, context }) {
        withFields({
            [field.fieldId]: getFileField({ field, validation: false, context })
        })(model);
    }
};

export default plugin;
