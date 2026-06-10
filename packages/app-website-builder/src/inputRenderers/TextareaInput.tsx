import React from "react";
import { Textarea } from "@webiny/admin-ui";
import type { ElementInputRendererProps } from "~/BaseEditor/index.js";

export const TextareaInputRenderer = ({
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
        <Textarea
            size={"md"}
            variant={"secondary"}
            value={value || ""}
            onChange={previewValue}
            onBlur={e => commitValue(e.currentTarget.value)}
            label={label}
            description={input.description}
            note={input.helperText}
            rows={10}
        />
    );
};
