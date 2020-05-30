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
                list: field.multipleValues,
                async getStorageValue() {
                    // Not using getValue method because it would load the model without need.
                    const element = cloneDeep(this.current);

                    // Only save `key`
                    const settings = await context.settingsManager.getSettings("file-manager");
                    let elementWithoutSrcPrefix;

                    if (Array.isArray(element)) {
                        elementWithoutSrcPrefix = element.map(el => {
                            if (el.includes(settings.srcPrefix)) {
                                const [, key] = el.split(settings.srcPrefix);
                                return key;
                            }
                            return el;
                        });
                        return elementWithoutSrcPrefix;
                    }

                    if (element.includes(settings.srcPrefix)) {
                        const [, key] = element.split(settings.srcPrefix);
                        return key;
                    }

                    return element;
                },
                async setStorageValue(element) {
                    const settings = await context.settingsManager.getSettings("file-manager");
                    let elementWithSrcPrefix;
                    if (Array.isArray(element)) {
                        elementWithSrcPrefix = element.map(el => settings.srcPrefix + el);
                    } else {
                        elementWithSrcPrefix = settings.srcPrefix + element;
                    }

                    this.setValue(elementWithSrcPrefix, {
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
        // Searching multiple-value fields is not supported.
        if (field.multipleValues) {
            return;
        }

        withFields({
            [field.fieldId]: getFileField({ field, validation: false, context })
        })(model);
    }
};

export default plugin;
