import { CmsModelField } from "~/types";
import { getBaseFieldType } from "~/utils/getBaseFieldType";
import WebinyError from "@webiny/error";

const defaultTitleFieldId = "id";

const allowedTitleFieldTypes = ["text", "number"];

export const getContentModelTitleFieldId = (
    fields: CmsModelField[],
    titleFieldId?: string
): string => {
    /**
     * If there are no fields defined, we will return the default field
     */
    if (fields.length === 0) {
        return defaultTitleFieldId;
    }
    /**
     * if there is no title field defined either in input data or existing content model data
     * we will take first text field that has no multiple values enabled
     * or if initial titleFieldId is the default one also try to find first available text field
     */
    if (!titleFieldId || titleFieldId === defaultTitleFieldId) {
        const titleField = fields.find(field => {
            return getBaseFieldType(field) === "text" && !field.multipleValues;
        });
        return titleField?.fieldId || defaultTitleFieldId;
    }
    /**
     * check existing titleFieldId for existence in the model
     * for correct type
     * and that it is not multiple values field
     */
    const target = fields.find(f => f.fieldId === titleFieldId);
    if (!target) {
        throw new WebinyError(
            `Field selected for the title field does not exist in the model.`,
            "VALIDATION_ERROR",
            {
                fieldId: titleFieldId,
                fields
            }
        );
    }

    if (allowedTitleFieldTypes.includes(target.type) === false) {
        throw new WebinyError(
            `Only ${allowedTitleFieldTypes.join(
                ", "
            )} and id fields can be used as an entry title.`,
            "ENTRY_TITLE_FIELD_TYPE",
            {
                storageId: target.storageId,
                fieldId: target.fieldId,
                type: target.type
            }
        );
    }

    if (target.multipleValues) {
        throw new WebinyError(
            `Fields that accept multiple values cannot be used as the entry title.`,
            "ENTRY_TITLE_FIELD_TYPE",
            {
                storageId: target.storageId,
                fieldId: target.fieldId,
                type: target.type
            }
        );
    }

    return target.fieldId;
};
