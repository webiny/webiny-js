import WebinyError from "@webiny/error";
import { CmsEntry, CmsContext, CmsModelLockedFieldPlugin, LockedField, CmsModel } from "~/types";
import { CmsModelPlugin } from "~/plugins/CmsModelPlugin";
import { getBaseFieldType } from "~/utils/getBaseFieldType";

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
        const baseType = getBaseFieldType(field);
        const alreadyLocked = existingLockedFields.some(
            lockedField => lockedField.fieldId === field.storageId
        );
        if (alreadyLocked) {
            continue;
        }

        let lockedFieldData = {};

        const lockedFieldPlugins = cmsLockedFieldPlugins.filter(pl => pl.fieldType === baseType);
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
            fieldId: field.storageId,
            multipleValues: !!field.multipleValues,
            type: baseType,
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
            /**
             * At this point we know this is a CmsModel, so it is safe to cast.
             */
            original: model as CmsModel,
            model: {
                ...model,
                lockedFields: newLockedFields
            } as CmsModel
        });
        model.lockedFields = newLockedFields;
    } catch (ex) {
        throw new WebinyError(
            `Could not update model "${model.modelId}" with new locked fields.`,
            "MODEL_LOCKED_FIELDS_UPDATE_FAILED",
            {
                message: ex.message,
                code: ex.code,
                data: ex.data
            }
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
            original: model as CmsModel,
            model: {
                ...model,
                lockedFields: []
            } as CmsModel
        });
        model.lockedFields = [];
    } catch (ex) {
        throw new WebinyError(
            `Could not update model "${model.modelId}" with unlocked fields.`,
            "MODEL_UNLOCKED_FIELDS_UPDATE_FAILED",
            {
                message: ex.message,
                code: ex.code,
                data: ex.data
            }
        );
    }
};
