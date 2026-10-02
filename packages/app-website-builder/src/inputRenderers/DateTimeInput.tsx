import React from "react";
import { DatePicker } from "@webiny/admin-ui";
import type { ElementInputRendererProps } from "~/BaseEditor/index.js";

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
                    value.set(newValue);
                });
            }}
            label={label}
            description={input.description}
            note={input.helperText}
        />
    );
};
