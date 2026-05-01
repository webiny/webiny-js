import React from "react";
import {
    DatePickerPrimitive,
    FormComponentDescription,
    FormComponentLabel,
    FormComponentNote
} from "@webiny/admin-ui";
import { createFieldRenderer } from "~/features/formModel/createFieldRenderer.js";

declare module "../../../features/formModel/abstractions.js" {
    interface IFieldRendererRegistry {
        dateTimeInput: {
            fieldType: "datetime";
            settings: {
                type:
                    | "date"
                    | "time"
                    | "dateTimeWithoutTimezone"
                    | "dateTimeWithTimezone"
                    | "month"
                    | "week"
                    | "year"
                    | "dateRange"
                    | "multipleDates"
                    | "multipleMonths"
                    | "multipleYears";
                displayFormat?: string;
                yearRange?: [number, number];
                weekStartsOn?: 0 | 1 | 2 | 3 | 4 | 5 | 6;
                presets?: Array<{ label: string; value: () => Date }>;
            };
        };
    }
}

const PICKER_TYPE_MAP: Record<string, string> = {
    date: "date",
    time: "time",
    dateTimeWithoutTimezone: "dateTimeLocal",
    dateTimeWithTimezone: "dateTimeTz",
    month: "month",
    week: "week",
    year: "year",
    dateRange: "dateRange",
    multipleDates: "multipleDates",
    multipleMonths: "multipleMonths",
    multipleYears: "multipleYears"
};

export const DateTimeRenderer = createFieldRenderer<"dateTimeInput">(({ field }) => {
    const settingsType = field.rendererSettings?.type ?? "date";
    const pickerType = PICKER_TYPE_MAP[settingsType] || "date";

    return (
        <div className="w-full">
            <FormComponentLabel
                text={field.label}
                required={field.required}
                disabled={field.disabled}
            />
            {field.description && <FormComponentDescription text={field.description} />}
            <DatePickerPrimitive
                type={pickerType as any}
                value={field.value as any}
                onChange={(v: any) => field.onChange(v)}
                disabled={field.disabled}
                placeholder={field.placeholder}
                displayFormat={field.rendererSettings?.displayFormat}
                yearRange={field.rendererSettings?.yearRange}
                weekStartsOn={field.rendererSettings?.weekStartsOn}
                presets={field.rendererSettings?.presets}
            />
            <FormComponentNote text={field.note} disabled={field.disabled} />
        </div>
    );
});
