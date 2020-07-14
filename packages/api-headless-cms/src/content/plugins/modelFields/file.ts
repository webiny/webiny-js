import cloneDeep from "lodash/cloneDeep";
import { CmsModelFieldToCommodoFieldPlugin } from "@webiny/api-headless-cms/types";
import { withFields, string } from "@webiny/commodo";
import { i18nField } from "./i18nFields";

function getFileField({ field, validation, context }) {
    return string({
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
    }
};

export default plugin;
