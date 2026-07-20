import type { CmsModelDateTimeField } from "@webiny/api-headless-cms/types/index.js";
import { CmsEntryOpenSearchFieldIndex } from "../abstractions/CmsEntryOpenSearchFieldIndex.js";

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

const convertValueToIndex = (value: string, field: CmsModelDateTimeField) => {
    if (!value) {
        return null;
    } else if (field.settings?.type === "time") {
        return convertTimeToNumber(value);
    }
    return value;
};

const convertValueFromIndex = (
    value: string | number,
    field: CmsModelDateTimeField
): string | null => {
    const type = field.settings?.type;
    if (type === "time") {
        return convertNumberToTime(value as number);
    } else if (!value) {
        return null;
    } else if (type === "dateTimeWithTimezone") {
        return value as string;
    } else if (type === "date") {
        const dateValue = new Date(value);
        return dateValue.toISOString().slice(0, 10);
    }
    return new Date(value).toISOString();
};

class DateTimeFieldIndexImpl implements CmsEntryOpenSearchFieldIndex.Interface {
    public readonly fieldType = "datetime";

    public unmappedType(): string {
        return "date";
    }

    public toIndex({
        field,
        value
    }: CmsEntryOpenSearchFieldIndex.ToIndex): CmsEntryOpenSearchFieldIndex.ToValue {
        if (Array.isArray(value) === true) {
            return {
                value: value.map((v: string) => {
                    return convertValueToIndex(v, field as CmsModelDateTimeField);
                })
            };
        }
        return {
            value: convertValueToIndex(value, field as CmsModelDateTimeField)
        };
    }

    public fromIndex({ field, value }: CmsEntryOpenSearchFieldIndex.FromIndex): any {
        if (Array.isArray(value) === true) {
            return value.map((v: string) => {
                return convertValueFromIndex(v, field as CmsModelDateTimeField);
            });
        }
        return convertValueFromIndex(value, field as CmsModelDateTimeField);
    }
}

export const DateTimeFieldIndex = CmsEntryOpenSearchFieldIndex.createImplementation({
    implementation: DateTimeFieldIndexImpl,
    dependencies: []
});
