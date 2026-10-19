import React from "react";
import { DatePicker } from "@webiny/admin-ui";
import type { ElementInputRendererProps } from "~/BaseEditor/index.js";

/**
 * The `dateTimeLocal` picker displays the stored ISO instant in local time, but emits the edited
 * local wall-clock time with a `Z` suffix. Read that wall-clock time as local and convert it to a
 * real UTC instant, so the stored value matches what the user picked.
 */
export const toUtcIsoString = (pickerValue: string | undefined) => {
    if (!pickerValue) {
        return undefined;
    }
    return new Date(pickerValue.replace(/Z$/, "")).toISOString();
};

export const DateTimeInputRenderer = ({
    value,
    onChange,
    input,
    label
}: ElementInputRendererProps) => {
    return (
        <DatePicker
            type={"dateTimeLocal"}
            value={value || undefined}
            onChange={(newValue: string | undefined) => {
                onChange(({ value }) => {
                    value.set(toUtcIsoString(newValue));
                });
            }}
            label={label}
            description={input.description}
            note={input.helperText}
        />
    );
};
