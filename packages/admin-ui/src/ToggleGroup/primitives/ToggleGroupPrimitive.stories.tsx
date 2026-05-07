import React, { useState } from "react";
import type { Meta, StoryObj } from "@storybook/react-webpack5";
import { ReactComponent as BoldIcon } from "@webiny/icons/format_bold.svg";
import { ReactComponent as ItalicIcon } from "@webiny/icons/format_italic.svg";
import { ReactComponent as UnderlineIcon } from "@webiny/icons/format_underlined.svg";
import { ReactComponent as AlignLeftIcon } from "@webiny/icons/format_align_left.svg";
import { ReactComponent as AlignCenterIcon } from "@webiny/icons/format_align_center.svg";
import { ReactComponent as AlignRightIcon } from "@webiny/icons/format_align_right.svg";
import { ToggleGroupPrimitive } from "./ToggleGroupPrimitive.js";

const textItems = [
    { value: "bold", label: "Bold" },
    { value: "italic", label: "Italic" },
    { value: "underline", label: "Underline" }
];

const iconItems = [
    { value: "left", icon: <AlignLeftIcon /> },
    { value: "center", icon: <AlignCenterIcon /> },
    { value: "right", icon: <AlignRightIcon /> }
];

const iconTextItems = [
    { value: "bold", label: "Bold", icon: <BoldIcon /> },
    { value: "italic", label: "Italic", icon: <ItalicIcon /> },
    { value: "underline", label: "Underline", icon: <UnderlineIcon /> }
];

const meta: Meta<typeof ToggleGroupPrimitive> = {
    title: "Components/Form Primitives/ToggleGroup",
    component: ToggleGroupPrimitive,
    parameters: {
        layout: "padded"
    },
    render: args => {
        const [value, setValue] = useState<string>("");
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
    args: { items: textItems }
};

export const Bordered: Story = {
    args: { items: textItems, bordered: true }
};

export const IconOnly: Story = {
    args: { items: iconItems, bordered: true }
};

export const IconOnlyGhost: Story = {
    args: { items: iconItems, variant: "ghost", bordered: true }
};

export const WithIconAndText: Story = {
    args: { items: iconTextItems, bordered: true }
};

export const WithIconAndTextOutline: Story = {
    args: { items: iconTextItems, variant: "outline", bordered: true }
};

export const Outline: Story = {
    args: { items: textItems, variant: "outline", bordered: true }
};

export const Ghost: Story = {
    args: { items: textItems, variant: "ghost", bordered: true }
};

export const SizeSmall: Story = {
    args: { items: iconItems, size: "sm", bordered: true }
};

export const SizeMedium: Story = {
    args: { items: iconItems, size: "md", bordered: true }
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
    args: { items: iconTextItems, bordered: true }
};

export const Disabled: Story = {
    args: { items: iconItems, bordered: true, disabled: true }
};
