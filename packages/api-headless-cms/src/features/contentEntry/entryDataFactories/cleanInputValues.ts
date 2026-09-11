import WebinyError from "@webiny/error";
import type { CmsEntryValues, CmsModel, CmsModelField } from "~/types/index.js";

type DefaultValue = boolean | number | string | null;

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
    const { settings, list } = field;
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
    if (!list) {
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

/**
 * Reduces raw input values to the model's own fields, applying each field's default value
 * where the input has none.
 */
export const cleanInputValues = <TValues extends CmsEntryValues = CmsEntryValues>(
    model: CmsModel,
    input: TValues
) => {
    return model.fields.reduce<TValues>((acc, field) => {
        if (!field.fieldId) {
            throw new WebinyError("Field does not have an fieldId.", "MISSING_FIELD_ID", {
                field
            });
        }
        const key = field.fieldId as keyof TValues;
        const value = input[key] as TValues[keyof TValues];
        acc[key] = value === undefined ? (getDefaultValue(field) as TValues[keyof TValues]) : value;
        return acc;
    }, {} as TValues);
};
