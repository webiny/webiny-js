import React from "react";
import { Tags } from "@webiny/admin-ui";
import type { ElementInputRendererProps } from "~/BaseEditor/index.js";

export const TagsInputRenderer = ({ value, onChange, input, label }: ElementInputRendererProps) => {
    const commitValue = (newValue: string[]) => {
        onChange(({ value }) => {
            value.set(newValue);
        });
    };

    return (
        <Tags
            size={"md"}
            variant={"secondary"}
            value={Array.isArray(value) ? value : []}
            onChange={commitValue}
            placeholder={"Add values"}
            label={label}
            description={input.description}
            note={input.helperText}
        />
    );
};
