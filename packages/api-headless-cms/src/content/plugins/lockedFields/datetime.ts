import { CmsModelLockedFieldPlugin } from "@webiny/api-headless-cms/types";

const plugin: CmsModelLockedFieldPlugin = {
    name: "cms-model-locked-field-datetime",
    type: "cms-model-locked-field",
    fieldType: "datetime",
    manage: {
        checkLockedFieldInvariant({ lockedField, field }) {
            if (lockedField.formatType && lockedField.formatType !== field.settings.type) {
                throw new Error(
                    `Cannot change "type" for the "${lockedField.fieldId}" field because it's already in use in created content.`
                );
            }
        },
        createLockedField({ field }) {
            return {
                formatType: field.settings.type
            };
        }
    }
};

export default plugin;
