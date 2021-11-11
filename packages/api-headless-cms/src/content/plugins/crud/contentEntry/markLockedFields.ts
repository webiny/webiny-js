import WebinyError from "@webiny/error";
import { CmsContentEntry, CmsContentModel, CmsContext, CmsModelLockedFieldPlugin } from "~/types";
import { ContentModelPlugin } from "~/content/plugins/ContentModelPlugin";

interface Args {
    model: CmsContentModel;
    entry: CmsContentEntry;
    context: CmsContext;
}
export const markLockedFields = async ({ model, context }: Args): Promise<void> => {
    // If the model is registered via a plugin, we don't need do process anything.
    const plugins = context.plugins.byType<ContentModelPlugin>(ContentModelPlugin.type);
    if (plugins.find(plugin => plugin.contentModel.modelId === model.modelId)) {
        return;
    }

    const cmsLockedFieldPlugins =
        context.plugins.byType<CmsModelLockedFieldPlugin>("cms-model-locked-field");

    const existingLockedFields = model.lockedFields || [];
    const lockedFields = [];
    for (const field of model.fields) {
        const alreadyLocked = existingLockedFields.some(
            lockedField => lockedField.fieldId === field.fieldId
        );
        if (alreadyLocked) {
            continue;
        }

        let lockedFieldData = {};

        const lockedFieldPlugins = cmsLockedFieldPlugins.filter(pl => pl.fieldType === field.type);
        for (const plugin of lockedFieldPlugins) {
            if (typeof plugin.getLockedFieldData !== "function") {
                continue;
            }
            const data = plugin.getLockedFieldData({
                field
            });
            lockedFieldData = { ...lockedFieldData, ...data };
        }

        lockedFields.push({
            fieldId: field.fieldId,
            multipleValues: field.multipleValues,
            type: field.type,
            ...lockedFieldData
        });
    }
    // no need to update anything if no locked fields were added
    if (lockedFields.length === 0) {
        return;
    }

    const newLockedFields = existingLockedFields.concat(lockedFields);

    try {
        await context.cms.models.updateModelDirect({
            original: model,
            model: {
                ...model,
                lockedFields: newLockedFields
            }
        });
        model.lockedFields = newLockedFields;
    } catch (ex) {
        throw new WebinyError(
            `Could not update model "${model.modelId}" with new locked fields.`,
            "MODEL_LOCKED_FIELDS_UPDATE_FAILED",
            ex
        );
    }
};
