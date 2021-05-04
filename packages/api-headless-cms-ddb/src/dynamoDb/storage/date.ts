import WebinyError from "@webiny/error";
import {
    CmsContentModelDateTimeField,
    CmsModelFieldToStoragePlugin
} from "@webiny/api-headless-cms/types";
import formatDate from "date-fns/format";
import parseISODate from "date-fns/parseISO";
import parseTime from "date-fns/parse";

interface StorageValue {
    /**
     * Original value - either date converted to a string or original string.
     */
    v: string;
    /**
     * A unix timestamp.
     */
    t: number;
    /**
     * Does the o string need to be converted back to Date.
     */
    c?: boolean;
}

const excludeTypes = ["time", "dateTimeWithTimezone"];

const convertToStorage = (original: Date | string): StorageValue | null => {
    if (!original) {
        return null;
    }
    const isDate = !!(original as Date).toISOString;
    const value: string = isDate ? (original as Date).toISOString() : (original as string);
    const date = parseISODate(value);
    return {
        v: value,
        t: Number(formatDate(date, "T")),
        c: isDate
    };
};

const convertFromStorage = (data: StorageValue): Date | string | null => {
    const { v: value, c: convert } = data;
    if (!value) {
        throw new WebinyError(
            "Storage value cannot have null converted value.",
            "CONVERTED_VALUE_ERROR",
            {
                data
            }
        );
    }
    if (!convert) {
        return value;
    }
    return new Date(value);
};

const toUnixTime = (value?: null | string | Date): number | null => {
    if (value === undefined || value === null) {
        return null;
    }
    const date = parseISODate(
        (value as Date).toISOString ? (value as Date).toISOString() : (value as string)
    );
    return Number(formatDate(date, "T"));
};

const convertTimeToStorage = (value: string): StorageValue => {
    const time = formatDate(parseTime(value, "HH:mm:ss", new Date()), "HH:mm:ss");
    const [hours, minutes, seconds = 0] = time.split(":").map(Number);
    return {
        v: time,
        t: hours * 60 * 60 + minutes * 60 + seconds
    };
};

const convertTimeFromStorage = (data: StorageValue): string | null => {
    return data.v || null;
};

export default (): CmsModelFieldToStoragePlugin<Date | string, StorageValue | null> => ({
    type: "cms-model-field-to-storage",
    name: "cms-model-field-to-storage-datetime",
    fieldType: "datetime",
    async fromStorage({ field, value }) {
        const { type } = (field as CmsContentModelDateTimeField).settings;
        if (!value) {
            return null;
        } else if (type === "time") {
            return convertTimeFromStorage(value);
        }
        return convertFromStorage(value);
    },
    async toStorage({ value, field }) {
        const { type } = (field as CmsContentModelDateTimeField).settings;
        const convert = !excludeTypes.includes(type);
        if ((!value || !type || !convert) && type !== "time") {
            return convertToStorage(String(value));
        } else if (type === "time") {
            return convertTimeToStorage(value as string);
        } else if ((value as any).toISOString) {
            return convertToStorage(value as Date);
        } else if (typeof value === "string") {
            try {
                return convertToStorage(new Date(value));
            } catch (ex) {
                throw new WebinyError(
                    "Could not convert value to storage - string date conversion.",
                    "TO_STORAGE_ERROR",
                    {
                        value,
                        error: {
                            message: ex.message,
                            code: ex.code,
                            data: ex.data
                        }
                    }
                );
            }
        }
        throw new WebinyError("Error converting value to a storage type.", "TO_STORAGE_ERROR", {
            value,
            fieldId: field.fieldId
        });
    },
    convertToSearch: ({ field, value }) => {
        const { type } = (field as CmsContentModelDateTimeField).settings;
        let converted: number;
        if (type === "time") {
            const { t: timeValue } = convertTimeToStorage(value);
            converted = timeValue;
        } else {
            converted = toUnixTime(value);
        }
        return {
            attr: `${field.fieldId}.v`,
            value: converted
        };
    }
});
