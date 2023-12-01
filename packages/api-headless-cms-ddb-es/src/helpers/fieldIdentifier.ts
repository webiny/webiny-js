import { CmsEntryValues, CmsModelField } from "@webiny/api-headless-cms/types";

const hasOwnProperty = (
    values: CmsEntryValues | null | undefined = {},
    property: string
): boolean => {
    if (!values) {
        return false;
    } else if (values.hasOwnProperty) {
        return values.hasOwnProperty(property);
    }
    return values[property] !== undefined;
};

export const getFieldIdentifier = (
    values: CmsEntryValues | null | undefined,
    field: CmsModelField
): string | undefined => {
    if (field.storageId && hasOwnProperty(values, field.storageId)) {
        return field.storageId;
    } else if (hasOwnProperty(values, field.fieldId)) {
        return field.fieldId;
    }
    return undefined;
};

export const getFieldIdentifiers = (
    values: CmsEntryValues,
    rawValues: CmsEntryValues | null | undefined,
    field: CmsModelField
) => {
    let valueIdentifier = getFieldIdentifier(values, field);
    let rawValueIdentifier = getFieldIdentifier(rawValues, field);
    if (!valueIdentifier && !rawValueIdentifier) {
        return null;
    }
    if (!valueIdentifier) {
        valueIdentifier = rawValueIdentifier as string;
    }
    if (!rawValueIdentifier) {
        rawValueIdentifier = valueIdentifier as string;
    }
    return {
        valueIdentifier,
        rawValueIdentifier
    };
};
