import WebinyError from "@webiny/error";
import { CmsModelField, CreateCmsEntryInput, UpdateCmsEntryInput } from "~/types";

type DefaultValue = boolean | number | string | null;
/**
 * Used for some fields to convert their values.
 */
const convertDefaultValue = (field: CmsModelField, value: DefaultValue): DefaultValue => {
    switch (field.type) {
        case "boolean":
            return Boolean(value);
        case "number":
            return Number(value);
        default:
            return value;
    }
};
const getDefaultValue = (field: CmsModelField): (DefaultValue | DefaultValue[]) | undefined => {
    const { settings, multipleValues } = field;
    if (settings && settings.defaultValue !== undefined) {
        return convertDefaultValue(field, settings.defaultValue);
    }
    const { predefinedValues } = field;
    if (
        !predefinedValues ||
        !predefinedValues.enabled ||
        Array.isArray(predefinedValues.values) === false
    ) {
        return undefined;
    }
    if (!multipleValues) {
        const selectedValue = predefinedValues.values.find(value => {
            return !!value.selected;
        });
        if (selectedValue) {
            return convertDefaultValue(field, selectedValue.value);
        }
        return undefined;
    }
    return predefinedValues.values
        .filter(({ selected }) => !!selected)
        .map(({ value }) => {
            return convertDefaultValue(field, value);
        });
};

interface Params {
    fields: CmsModelField[];
    input: CreateCmsEntryInput | UpdateCmsEntryInput;
    options?: {
        validate?: boolean;
    };
}

/**
 * Cleans and adds default values to create input data.
 */
export const mapAndCleanCreateInputData = (params: Params) => {
    const { fields, input, options } = params;
    return fields.reduce<CreateCmsEntryInput>((acc, field) => {
        /**
         * This should never happen, but let's make it sure.
         * The fix would be for the user to add the fieldId on the field definition.
         */
        if (!field.fieldId) {
            throw new WebinyError("Field does not have an fieldId.", "MISSING_FIELD_ID", {
                field
            });
        }
        const value = input[field.fieldId];
        if (options?.validate) {
            /**
             * We set the default value on create input if value is not defined.
             */
            acc[field.fieldId] = value === undefined ? getDefaultValue(field) : value;
            return acc;
        } else if (field.type === "text") {
            acc[field.fieldId] = value === "" ? null : value;
        }

        return acc;
    }, {});
};

/**
 * Cleans the update input entry data.
 */
export const mapAndCleanUpdatedInputData = (params: Params) => {
    const { fields, input } = params;
    return fields.reduce<UpdateCmsEntryInput>((acc, field) => {
        /**
         * This should never happen, but let's make it sure.
         * The fix would be for the user to add the fieldId on the field definition.
         */
        if (!field.fieldId) {
            throw new WebinyError("Field does not have an fieldId.", "MISSING_FIELD_ID", {
                field
            });
        }
        /**
         * We cannot set default value here because user might want to update only certain field values.
         */
        const value = input[field.fieldId];
        if (value === undefined) {
            return acc;
        }
        acc[field.fieldId] = value;
        return acc;
    }, {});
};
