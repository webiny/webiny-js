import React from "react";
import { RadioGroup } from "@webiny/admin-ui";
import type { ElementInputRendererProps } from "~/BaseEditor/index.js";
import type { RadioInput } from "@webiny/website-builder-sdk";

export const RadioInputRenderer = ({
    value,
    onChange,
    label,
    ...props
}: ElementInputRendererProps) => {
    const input = props.input as RadioInput;
    return (
        <RadioGroup
            value={value}
            onChange={newValue => {
                onChange(({ value }) => {
                    value.set(newValue);
                });
            }}
            items={input.options}
            label={label}
            description={input.description}
            note={input.helperText}
        />
    );
};
