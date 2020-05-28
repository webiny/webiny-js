import cloneDeep from "lodash.clonedeep";
import { CmsModelFieldToCommodoFieldPlugin } from "@webiny/api-headless-cms/types";
import { withFields, string } from "@webiny/commodo";
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
            cField = string({
                validation,
                async getStorageValue() {
                    // Not using getValue method because it would load the model without need.
                    const element = cloneDeep(this.current);

                    // Only save `key`
                    const settings = context.files.getFileSettings();
                    if (element.includes(settings.srcPrefix)) {
                        const [, key] = element.split(settings.srcPrefix);
                        return key;
                    }

                    return element;
                },
                async setStorageValue(element) {
                    const settings = context.files.getFileSettings();
                    const fullSrc = settings.srcPrefix + element;

                    this.setValue(fullSrc, {
                        skipDifferenceCheck: true,
                        forceSetAsClean: true
                    });
                    return this;
                }
            });
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
