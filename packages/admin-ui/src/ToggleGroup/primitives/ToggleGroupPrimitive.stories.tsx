import React, { useState } from "react";
import type { Meta, StoryObj } from "@storybook/react-webpack5";
import { ToggleGroupPrimitive } from "./ToggleGroupPrimitive.js";

const items = [
    { value: "bold", label: "Bold" },
    { value: "italic", label: "Italic" },
    { value: "underline", label: "Underline" }
];

const meta: Meta<typeof ToggleGroupPrimitive> = {
    title: "Components/Form Primitives/ToggleGroup",
    component: ToggleGroupPrimitive,
    parameters: {
        layout: "padded"
    },
    render: args => {
        const [value, setValue] = useState<string>(
            args.type !== "multiple" ? ((args.value as string) ?? "") : ""
        );
        return (
            <ToggleGroupPrimitive
                {...args}
                type="single"
                value={value}
                onChange={v => setValue(v as string)}
            />
        );
    }
};

export default meta;
type Story = StoryObj<typeof ToggleGroupPrimitive>;

export const Default: Story = {
    args: { items }
};

export const Bordered: Story = {
    args: { items, bordered: true }
};

export const Outline: Story = {
    args: { items, variant: "outline", bordered: true }
};

export const Ghost: Story = {
    args: { items, variant: "ghost", bordered: true }
};

export const SizeSmall: Story = {
    args: { items, size: "sm", bordered: true }
};

export const SizeLarge: Story = {
    args: { items, size: "lg", bordered: true }
};

export const Multiple: Story = {
    render: args => {
        const [value, setValue] = useState<string[]>([]);
        return (
            <ToggleGroupPrimitive
                {...args}
                type="multiple"
                value={value}
                onChange={v => setValue(v as string[])}
            />
        );
    },
    args: { items, bordered: true }
};

export const Disabled: Story = {
    args: { items, bordered: true, disabled: true }
};
