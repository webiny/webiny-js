import React, { useState } from "react";
import type { Meta, StoryObj } from "@storybook/react-webpack5";
import { Tooltip } from "~/Tooltip/index.js";
import { ToggleGroup } from "~/ToggleGroup/index.js";

const items = [
    { value: "bold", label: "Bold" },
    { value: "italic", label: "Italic" },
    { value: "underline", label: "Underline" }
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
    args: { items, label: "Text formatting", bordered: true }
};

export const Outline: Story = {
    args: { items, label: "Text formatting", variant: "outline", bordered: true }
};

export const Ghost: Story = {
    args: { items, label: "Text formatting", variant: "ghost", bordered: true }
};

export const WithDescription: Story = {
    args: {
        items,
        label: "Text formatting",
        description: "Choose one or more formatting options.",
        bordered: true
    }
};

export const WithNotes: Story = {
    args: {
        items,
        label: "Text formatting",
        note: "Note: Formatting applies to selected text only.",
        bordered: true
    }
};

export const WithErrors: Story = {
    args: {
        items,
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
    args: { items, label: "Text formatting", bordered: true }
};

export const Disabled: Story = {
    args: { items, label: "Text formatting", bordered: true, disabled: true }
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
        items,
        label: "Text formatting",
        bordered: true,
        description: "Choose a formatting option to apply to the selected text.",
        note: "Note: Formatting applies to selected text only."
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
            options: ["sm", "md", "lg", "xl"]
        },
        onChange: { description: "Called with the new value when selection changes" }
    }
};
