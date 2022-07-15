import WebinyError from "@webiny/error";
import { CmsEntry, CmsModel, CmsContext, CmsModelLockedFieldPlugin, LockedField } from "~/types";
import { CmsModelPlugin } from "~/plugins/CmsModelPlugin";

interface MarkLockedFieldsParams {
    model: CmsModel;
    entry: CmsEntry;
    context: CmsContext;
}
export const markLockedFields = async (params: MarkLockedFieldsParams): Promise<void> => {
    const { model, context } = params;
    /**
     * If the model is registered via a plugin, we don't need do process anything.
     */
    const plugins = context.plugins.byType<CmsModelPlugin>(CmsModelPlugin.type);
    if (plugins.find(plugin => plugin.contentModel.modelId === model.modelId)) {
        return;
    }

    const cmsLockedFieldPlugins =
        context.plugins.byType<CmsModelLockedFieldPlugin>("cms-model-locked-field");

    const existingLockedFields = model.lockedFields || [];
    const lockedFields: LockedField[] = [];
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
            multipleValues: !!field.multipleValues,
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
        await context.cms.updateModelDirect({
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

export interface MarkFieldsUnlockedParams {
    context: CmsContext;
    model: CmsModel;
}
export const markUnlockedFields = async (params: MarkFieldsUnlockedParams) => {
    const { context, model } = params;
    /**
     * If the model is registered via a plugin, we don't need do process anything.
     */
    const plugins = context.plugins.byType<CmsModelPlugin>(CmsModelPlugin.type);
    if (plugins.find(plugin => plugin.contentModel.modelId === model.modelId)) {
        return;
    }

    try {
        await context.cms.updateModelDirect({
            original: model,
            model: {
                ...model,
                lockedFields: []
            }
        });
        model.lockedFields = [];
    } catch (ex) {
        throw new WebinyError(
            `Could not update model "${model.modelId}" with unlocked fields.`,
            "MODEL_UNLOCKED_FIELDS_UPDATE_FAILED",
            ex
        );
    }
};
