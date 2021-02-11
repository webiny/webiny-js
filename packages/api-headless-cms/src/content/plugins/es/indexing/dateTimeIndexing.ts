import {
    CmsContentModelDateTimeField,
    CmsModelFieldToElasticsearchPlugin
} from "@webiny/api-headless-cms/types";

const convertTimeToNumber = (time?: string): number | null => {
    if (!time) {
        return null;
    }
    const [hours, minutes, seconds = 0] = time.split(":").map(Number);
    return hours * 60 * 60 + minutes * 60 + seconds;
};

const convertNumberToTime = (value?: number): string | null => {
    if (value === undefined || value === null) {
        return null;
    }
    const hours = Math.floor(value / 60 / 60);

    const minutes = Math.floor((value - hours * 60 * 60) / 60);

    const seconds = Math.floor(value - hours * 60 * 60 - minutes * 60);

    return [hours, minutes, seconds].map(v => String(v).padStart(2, "0")).join(":");
};

const convertValueFromIndex = (value: string | number, field: CmsContentModelDateTimeField) => {
    const type = field.settings.type;
    if (type === "time") {
        return convertNumberToTime(value as number);
    } else if (!value) {
        return null;
    } else if (type === "dateTimeWithTimezone") {
        return value;
    } else if (type === "date") {
        const dateValue = new Date(value);
        return dateValue.toISOString().substr(0, 10);
    }
    return new Date(value);
};

const convertValueToIndex = (value: string, field: CmsContentModelDateTimeField) => {
    if (!value) {
        return null;
    } else if (field.settings.type === "time") {
        return convertTimeToNumber(value);
    }
    return value;
};

export default (): CmsModelFieldToElasticsearchPlugin => ({
    type: "cms-model-field-to-elastic-search",
    name: "cms-model-field-to-elastic-search-datetime",
    fieldType: "datetime",
    unmappedType: () => {
        return "date";
    },
    toIndex({ field, toIndexEntry }) {
        const value = toIndexEntry.values[field.fieldId];
        const dateValue = convertValueToIndex(value, field as CmsContentModelDateTimeField);
        return {
            values: {
                ...toIndexEntry.values,
                [field.fieldId]: dateValue
            }
        };
    },
    fromIndex({ field, entry }) {
        const value = entry.values[field.fieldId];
        const dateValue = convertValueFromIndex(value, field as CmsContentModelDateTimeField);
        return {
            values: {
                ...entry.values,
                [field.fieldId]: dateValue
            }
        };
    }
});
