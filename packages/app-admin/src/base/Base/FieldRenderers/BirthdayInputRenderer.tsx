import React, { useMemo } from "react";
import { DatePicker } from "@webiny/admin-ui";
import { createFieldRenderer } from "~/features/formModel/createFieldRenderer.js";
import { getDateLimits, resolveDateLimits } from "~/features/formModel/fieldTypes/dateLimits.js";

declare module "../../../features/formModel/abstractions.js" {
    interface IFieldRendererRegistry {
        /**
         * Picks a day, then a month, then a year. It offers only the dates the field's
         * `dateGte`/`dateLte` limits allow; without limits, years run from this year back
         * 120 years.
         */
        birthdayInput: {
            fieldType: "datetime";
            settings?: undefined;
        };
    }
}

/** A `YYYY-MM-DD` date as local midnight, the way the picker compares dates. */
const toLocalDate = (value: string | undefined): Date | undefined => {
    const match = value?.match(/^(\d{4})-(\d{2})-(\d{2})/);
    return match ? new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3])) : undefined;
};

/**
 * Renders a date-only field as a step-by-step picker: day, then month, then year.
 * The value is the same `YYYY-MM-DD` string the calendar picker stores.
 */
export const BirthdayInputRenderer = createFieldRenderer<"birthdayInput">(({ field }) => {
    // Worked out on every render, so the limits follow the editor's local date.
    const { min, max } = resolveDateLimits(getDateLimits(field.rendererSettings));
    const minDate = useMemo(() => toLocalDate(min), [min]);
    const maxDate = useMemo(() => toLocalDate(max), [max]);

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
                minDate={minDate}
                maxDate={maxDate}
                label={field.label}
                description={field.description}
                note={field.note}
                required={field.required}
                validation={field.validation}
            />
        </div>
    );
});
