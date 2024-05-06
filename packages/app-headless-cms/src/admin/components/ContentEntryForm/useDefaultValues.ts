import { useMemo } from "react";
import { CmsContentEntry, CmsModel, CmsModelField } from "@webiny/app-headless-cms-common/types";

/**
 * Used for some fields to convert their values.
 */
const convertDefaultValue = (field: CmsModelField, value: any): string | number | boolean => {
    switch (field.type) {
        case "boolean":
            return Boolean(value);
        case "number":
            return Number(value);
        default:
            return value;
    }
};

export const useDefaultValues = (model: CmsModel) => {
    return useMemo(() => {
        const values: Partial<CmsContentEntry> = {};
        /**
         * Assign the default values:
         * * check the settings.defaultValue
         * * check the predefinedValues for selected value
         */
        for (const field of model.fields) {
            /**
             * When checking if defaultValue is set in settings, we do the undefined check because it can be null, 0, empty string, false, etc...
             */
            const { settings, multipleValues = false } = field;
            if (settings && settings.defaultValue !== undefined) {
                /**
                 * Special type of field is the boolean one.
                 * We MUST set true/false for default value.
                 */
                values[field.fieldId] = convertDefaultValue(field, settings.defaultValue);
                continue;
            }
            /**
             * No point in going further if predefined values are not enabled.
             */
            const { predefinedValues } = field;
            if (
                !predefinedValues ||
                !predefinedValues.enabled ||
                Array.isArray(predefinedValues.values) === false
            ) {
                continue;
            }
            /**
             * When field is not a multiple values one, we find the first possible default selected value and set it as field value.
             */
            if (!multipleValues) {
                const selectedValue = predefinedValues.values.find(({ selected }) => {
                    return !!selected;
                });
                if (selectedValue) {
                    values[field.fieldId] = convertDefaultValue(field, selectedValue.value);
                }
                continue;
            }
            /**
             *
             */
            values[field.fieldId] = predefinedValues.values
                .filter(({ selected }) => !!selected)
                .map(({ value }) => {
                    return convertDefaultValue(field, value);
                });
        }
        return values;
    }, [model.modelId]);
};
