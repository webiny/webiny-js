import React from "react";
import { Input } from "@webiny/admin-ui";
import type { ElementInputRendererProps } from "~/BaseEditor/index.js";

export const NumberInputRenderer = ({
    value,
    onChange,
    onPreviewChange,
    input,
    label
}: ElementInputRendererProps) => {
    const commitValue = (newValue: string) => {
        const number = parseInt(newValue);

        onChange(({ value }) => {
            value.set(isNaN(number) ? "" : number);
        });
    };

    const previewValue = (newValue: string) => {
        const number = parseInt(newValue);

        onPreviewChange(({ value }) => {
            value.set(isNaN(number) ? "" : number);
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
