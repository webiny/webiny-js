import React from "react";
import { ColorPicker } from "@webiny/admin-ui";
import type { ElementInputRendererProps } from "~/BaseEditor/index.js";

export const ColorPickerInputRenderer = ({
    value,
    onChange,
    onPreviewChange,
    input,
    label
}: ElementInputRendererProps) => {
    const commitValue = (newValue: string) => {
        onChange(({ value }) => {
            value.set(newValue);
        });
    };

    const previewValue = (newValue: string) => {
        onPreviewChange(({ value }) => {
            value.set(newValue);
        });
    };

    return (
        <ColorPicker
            size={"md"}
            variant={"secondary"}
            value={value}
            onChange={(newValue: string) => {
                previewValue(newValue);
                commitValue(newValue);
            }}
            label={label}
            hint={input.description}
            note={input.helperText}
        />
    );
};
