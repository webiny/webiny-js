import { CmsContentModelType, CmsContext } from "@webiny/api-headless-cms/types";

export const beforeSaveHook = (context: CmsContext, model: CmsContentModelType) => {
    let { titleFieldId } = model;
    const { fields, lockedFields = [] } = model;

    if (titleFieldId && !fields.find(item => item.fieldId === titleFieldId)) {
        throw new Error(
            `Cannot remove field "${titleFieldId}" because it's currently set as the title field. Please chose another title field first and try again.`
        );
    }

    // If no title field set, just use the first "text" field.
    const hasTitleFieldId = titleFieldId && fields.find(item => item.fieldId === titleFieldId);

    if (!hasTitleFieldId) {
        const titleField = fields.find(field => {
            return field.type === "text" && !field.multipleValues;
        });
        if (titleField) {
            titleFieldId = titleField.fieldId;
        }
    }
    // there is still a possibility that title field does not exist
    // that is mostly at points where there are no fields
    if (titleFieldId) {
        const field = fields.find(item => item.fieldId === titleFieldId);
        if (field.type !== "text") {
            throw new Error("Only text fields can be used as an entry title.");
        }

        if (field.multipleValues) {
            throw new Error(
                `Fields that accept multiple values cannot be used as the entry title (tried to use "${titleFieldId}" field)`
            );
        }
    }

    // We must not allow removal or changes in fields that are already in use in content entries.
    for (const lockedField of lockedFields) {
        const existingField = fields.find(item => item.fieldId === lockedField.fieldId);
        if (!existingField) {
            throw new Error(
                `Cannot remove the field "${lockedField.fieldId}" because it's already in use in created content.`
            );
        }

        if (lockedField.multipleValues !== existingField.multipleValues) {
            throw new Error(
                `Cannot change "multipleValues" for the "${lockedField.fieldId}" field because it's already in use in created content.`
            );
        }

        if (lockedField.type !== existingField.type) {
            throw new Error(
                `Cannot change field type for the "${lockedField.fieldId}" field because it's already in use in created content.`
            );
        }

        const cmsLockedFieldPlugins = context.plugins
            .byType("cms-model-locked-field")
            .filter(pl => pl.fieldType === lockedField.type);
        // Check `lockedField` invariant for specific field
        cmsLockedFieldPlugins.forEach(plugin => {
            if (typeof plugin.checkLockedField === "function") {
                plugin.checkLockedField({
                    lockedField,
                    field: existingField
                });
            }
        });
    }
};
