import React, { useCallback } from "react";
import { Input } from "@webiny/admin-ui";
import type { ElementInputRendererProps } from "~/BaseEditor/index.js";
import type { NumberInput } from "@webiny/website-builder-sdk";

export const NumberInputRenderer = ({
    value,
    onChange,
    input,
    label
}: ElementInputRendererProps) => {
    const localOnChange = useCallback(
        (value: string) => {
            const number = parseInt(value);
            const minValue = (input as NumberInput).minValue;

            if (minValue && number < minValue) {
                return;
            }

            onChange(({ value }) => {
                value.set(number);
            });
        },
        [onChange]
    );
    return (
        <Input
            type={"number"}
            size={"md"}
            variant={"secondary"}
            value={value}
            onChange={localOnChange}
            label={label}
            description={input.description}
            note={input.helperText}
        />
    );
};
