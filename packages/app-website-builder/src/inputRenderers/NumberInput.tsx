import React from "react";
import { Input } from "@webiny/admin-ui";
import type { ElementInputRendererProps } from "~/BaseEditor/index.js";
import type { NumberInput } from "@webiny/website-builder-sdk";

export const NumberInputRenderer = ({
    value,
    onChange,
    onPreviewChange,
    input,
    label
}: ElementInputRendererProps) => {
    const commitValue = (newValue: string) => {
        const number = parseInt(newValue);
        const minValue = (input as NumberInput).minValue;

        if (!isNaN(number) || (minValue && number < minValue)) {
            return;
        }

        onChange(({ value }) => {
            value.set(number);
        });
    };

    const previewValue = (newValue: string) => {
        const number = parseInt(newValue);

        if (isNaN(number)) {
            return;
        }

        onPreviewChange(({ value }) => {
            value.set(number);
        });
    };

    return (
        <Input
            type={"number"}
            value={value}
            onChange={previewValue}
            onBlur={e => commitValue(e.currentTarget.value)}
            onEnter={e => commitValue(e.currentTarget.value)}
            label={label}
            description={input.description}
            note={input.helperText}
        />
    );
};
