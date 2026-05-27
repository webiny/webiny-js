import React from "react";
import { SegmentedControl } from "@webiny/admin-ui";
import type { ElementInputRendererProps } from "~/BaseEditor/index.js";

const ITEMS = [
    { label: "Off", value: "false" },
    { label: "On", value: "true" }
];

export const BooleanInputRenderer = ({
    value,
    onChange,
    input,
    label
}: ElementInputRendererProps) => {
    const { description, helperText } = input;
    return (
        <SegmentedControl
            label={label}
            note={helperText}
            description={description}
            items={ITEMS}
            value={String(value)}
            onChange={newValue => {
                onChange(({ value }) => {
                    value.set(newValue === "true");
                });
            }}
        />
    );
};
