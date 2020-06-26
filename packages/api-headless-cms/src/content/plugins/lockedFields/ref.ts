import { CmsModelLockedFieldPlugin } from "@webiny/api-headless-cms/types";

const plugin: CmsModelLockedFieldPlugin = {
    name: "cms-model-locked-field-ref",
    type: "cms-model-locked-field",
    fieldType: "ref",
    manage: {
        checkLockedFieldInvariant({ lockedField, field }) {
            if (lockedField.modelId && lockedField.modelId !== field.settings.modelId) {
                throw new Error(
                    `Cannot change "modelId" for the "${lockedField.fieldId}" field because it's already in use in created content.`
                );
            }
        },
        createLockedField({ field }) {
            return {
                modelId: field.settings.modelId
            };
        }
    }
};

export default plugin;
