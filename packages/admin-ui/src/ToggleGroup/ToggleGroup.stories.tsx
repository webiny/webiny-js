import React, { useState } from "react";
import type { Meta, StoryObj } from "@storybook/react";
import { ReactComponent as BoldIcon } from "@webiny/icons/format_bold.svg";
import { ReactComponent as ItalicIcon } from "@webiny/icons/format_italic.svg";
import { ReactComponent as UnderlineIcon } from "@webiny/icons/format_underlined.svg";
import { ReactComponent as AlignLeftIcon } from "@webiny/icons/format_align_left.svg";
import { ReactComponent as AlignCenterIcon } from "@webiny/icons/format_align_center.svg";
import { ReactComponent as AlignRightIcon } from "@webiny/icons/format_align_right.svg";
import { Tooltip } from "~/Tooltip/index.js";
import { ToggleGroup } from "~/ToggleGroup/index.js";

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

const meta: Meta<typeof ToggleGroup> = {
    title: "Components/Form/ToggleGroup",
    component: ToggleGroup,
    parameters: {
        layout: "padded"
    },
    decorators: [
        Story => (
            <Tooltip.Provider>
                <Story />
            </Tooltip.Provider>
        )
    ],
    render: args => {
        const [value, setValue] = useState<string>("");
        return (
            <ToggleGroup
                {...args}
                type="single"
                value={value}
                onChange={v => setValue(v as string)}
            />
        );
    }
};

export default meta;
type Story = StoryObj<typeof ToggleGroup>;

export const Default: Story = {
    args: { items: textItems, label: "Text formatting", bordered: true }
};

export const IconOnly: Story = {
    args: { items: iconItems, label: "Alignment", bordered: true }
};

export const IconOnlyGhost: Story = {
    args: { items: iconItems, label: "Alignment", variant: "ghost", bordered: true }
};

export const WithIconAndText: Story = {
    args: { items: iconTextItems, label: "Text formatting", bordered: true }
};

export const Outline: Story = {
    args: { items: textItems, label: "Text formatting", variant: "outline", bordered: true }
};

export const Ghost: Story = {
    args: { items: textItems, label: "Text formatting", variant: "ghost", bordered: true }
};

export const WithDescription: Story = {
    args: {
        items: iconTextItems,
        label: "Text formatting",
        description: "Choose one or more formatting options.",
        bordered: true
    }
};

export const WithNotes: Story = {
    args: {
        items: iconItems,
        label: "Alignment",
        note: "Note: Formatting applies to selected text only.",
        bordered: true
    }
};

export const WithErrors: Story = {
    args: {
        items: textItems,
        label: "Text formatting",
        bordered: true,
        validation: { isValid: false, message: "Please select a formatting option." }
    }
};

export const Multiple: Story = {
    render: args => {
        const [value, setValue] = useState<string[]>([]);
        return (
            <ToggleGroup
                {...args}
                type="multiple"
                value={value}
                onChange={v => setValue(v as string[])}
            />
        );
    },
    args: { items: iconTextItems, label: "Text formatting", bordered: true }
};

export const Disabled: Story = {
    args: { items: iconItems, label: "Alignment", bordered: true, disabled: true }
};

export const Documentation: Story = {
    render: args => {
        const [value, setValue] = useState<string>("");
        return (
            <ToggleGroup
                {...args}
                type="single"
                value={value}
                onChange={v => setValue(v as string)}
            />
        );
    },
    args: {
        items: iconItems,
        label: "Alignment",
        bordered: true,
        description: "Choose a text alignment option.",
        note: "Note: Alignment applies to the selected paragraph."
    },
    argTypes: {
        label: { description: "Label above the group", control: "text" },
        description: { description: "Description below the label", control: "text" },
        note: { description: "Note below the group", control: "text" },
        bordered: { description: "Show a border around the group container", control: "boolean" },
        disabled: { description: "Disables all items", control: "boolean" },
        variant: {
            description: "Visual style of items",
            control: "select",
            options: ["primary", "outline", "ghost", "ghost-negative"]
        },
        size: {
            description: "Size of items",
            control: "select",
            options: ["sm", "md"]
        },
        onChange: { description: "Called with the new value when selection changes" }
    }
};
