import React from "react";
import { DatePicker } from "@webiny/admin-ui";
import { createFieldRenderer } from "~/features/formModel/createFieldRenderer.js";

declare module "../../../features/formModel/abstractions.js" {
    interface IFieldRendererRegistry {
        birthdayInput: {
            fieldType: "datetime";
            settings?: {
                type?: "date";
                /** Years offered, `[from, to]`. Defaults to this year back 120 years. */
                yearRange?: [number, number];
            };
        };
    }
}

/**
 * Renders a date-only field as a step-by-step picker: day, then month, then year.
 * The value is the same `YYYY-MM-DD` string the calendar picker stores.
 */
export const BirthdayInputRenderer = createFieldRenderer<"birthdayInput">(({ field }) => {
    return (
        <div className="w-full">
            <DatePicker
                hint={field.help}
                type={"birthday"}
                value={(field.value as string | undefined) ?? undefined}
                onChange={value => {
                    field.onChange(value);
                    field.onBlur();
                }}
                disabled={field.disabled}
                yearRange={field.rendererSettings?.yearRange}
                label={field.label}
                description={field.description}
                note={field.note}
                required={field.required}
                validation={field.validation}
            />
        </div>
    );
});
